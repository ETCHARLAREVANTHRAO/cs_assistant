import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, loadLlamaModelInfo, type LlamaContext } from 'llama.rn';

const MODEL_DIR = `${FileSystem.documentDirectory ?? ''}models/`;
const DEFAULT_MODEL_NAME = 'Qwen3.5-2B-Q4_K_M.gguf';
const STOP_WORDS = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|im_end|>',
  '<|EOT|>',
  '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>',
  '<|endoftext|>',
];

let context: LlamaContext | null = null;
let loadedModelPath = '';

export interface LocalModelStatus {
  modelPath: string;
  exists: boolean;
  sizeBytes: number;
  loaded: boolean;
}

export interface LocalChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function defaultModelPath() {
  return `${MODEL_DIR}${DEFAULT_MODEL_NAME}`;
}

async function ensureModelDir() {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

export async function getLocalModelStatus(modelPath = defaultModelPath()): Promise<LocalModelStatus> {
  await ensureModelDir();
  const info = await FileSystem.getInfoAsync(modelPath);
  return {
    modelPath,
    exists: info.exists,
    sizeBytes: info.exists && 'size' in info ? info.size ?? 0 : 0,
    loaded: !!context && loadedModelPath === modelPath,
  };
}

export async function importLocalModel(sourceUri: string, filename = DEFAULT_MODEL_NAME): Promise<LocalModelStatus> {
  await ensureModelDir();
  const safeName = filename.toLowerCase().endsWith('.gguf') ? filename : DEFAULT_MODEL_NAME;
  const destination = `${MODEL_DIR}${safeName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  if (context) {
    await context.release();
    context = null;
    loadedModelPath = '';
  }
  return getLocalModelStatus(destination);
}

export async function inspectLocalModel(modelPath = defaultModelPath()) {
  return loadLlamaModelInfo(modelPath);
}

export async function loadLocalModel(
  modelPath = defaultModelPath(),
  onProgress?: (progress: number) => void,
) {
  if (context && loadedModelPath === modelPath) return context;

  const status = await getLocalModelStatus(modelPath);
  if (!status.exists) {
    throw new Error('Model file not found. Import a GGUF model first.');
  }

  if (context) {
    await context.release();
  }

  context = await initLlama(
    {
      model: modelPath,
      n_ctx: 2048,
      n_batch: 256,
      n_threads: 4,
      n_gpu_layers: 0,
      use_mlock: false,
    },
    onProgress,
  );
  loadedModelPath = modelPath;
  return context;
}

export async function releaseLocalModel() {
  if (context) {
    await context.release();
    context = null;
    loadedModelPath = '';
  }
}

export async function generateLocalReply(
  messages: LocalChatMessage[],
  onToken?: (token: string) => void,
): Promise<string> {
  const active = await loadLocalModel();
  const result = await active.completion(
    {
      messages,
      n_predict: 220,
      temperature: 0.7,
      top_p: 0.9,
      stop: STOP_WORDS,
    },
    (data) => {
      if (data.token) onToken?.(data.token);
    },
  );
  return result.text?.trim() ?? '';
}
