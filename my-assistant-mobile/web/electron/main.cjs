const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = process.env.MY_ASSISTANT_BACKEND_PORT || '8000';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const MODEL_NAME = 'Qwen3.5-2B-Q4_K_M.gguf';
const START_LOCAL_BACKEND = process.env.MY_ASSISTANT_START_LOCAL_BACKEND !== '0';

let backendProcess = null;

function pathExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function getPaths() {
  if (app.isPackaged) {
    const resources = process.resourcesPath;
    return {
      backendDir: path.join(resources, 'backend'),
      pythonExe: path.join(resources, 'backend', '.venv', 'Scripts', 'python.exe'),
      modelPath: path.join(resources, 'models', MODEL_NAME),
      llamaServerPath: path.join(resources, 'llama', 'llama-server.exe'),
      logsDir: app.getPath('userData'),
    };
  }

  const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
  const backendDir = path.join(workspaceRoot, 'my-assistant-backend');
  const venvPython = path.join(backendDir, '.venv', 'Scripts', 'python.exe');

  return {
    backendDir,
    pythonExe: pathExists(venvPython) ? venvPython : 'python',
    modelPath: path.join(workspaceRoot, MODEL_NAME),
    llamaServerPath: 'C:\\tmp\\llama-cpp-test\\llama-server.exe',
    logsDir: backendDir,
  };
}

function startBackend() {
  const paths = getPaths();
  const stdoutPath = path.join(paths.logsDir, 'desktop-backend.log');
  const stderrPath = path.join(paths.logsDir, 'desktop-backend.err.log');
  const stdout = fs.openSync(stdoutPath, 'a');
  const stderr = fs.openSync(stderrPath, 'a');
  const env = {
    ...process.env,
    LOCAL_LLM_MODEL_PATH: paths.modelPath,
    LOCAL_LLM_SERVER_PATH: paths.llamaServerPath,
    LOCAL_LLM_SERVER_URL: process.env.LOCAL_LLM_SERVER_URL || 'http://127.0.0.1:8080',
  };

  delete env.SSLKEYLOGFILE;

  backendProcess = spawn(
    paths.pythonExe,
    ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', BACKEND_PORT],
    {
      cwd: paths.backendDir,
      env,
      stdio: ['ignore', stdout, stderr],
      windowsHide: true,
    },
  );

  backendProcess.on('exit', () => {
    fs.closeSync(stdout);
    fs.closeSync(stderr);
    backendProcess = null;
  });
}

function waitForBackend(timeoutMs = 60000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      req.on('error', retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('Backend did not become ready in time.'));
        return;
      }
      setTimeout(check, 1000);
    };

    check();
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (START_LOCAL_BACKEND) {
    try {
      await waitForBackend();
    } catch (error) {
      dialog.showErrorBox('my_assistant backend', error.message);
    }
  }

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await win.loadURL(devServerUrl);
    return;
  }

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  if (START_LOCAL_BACKEND) {
    startBackend();
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
