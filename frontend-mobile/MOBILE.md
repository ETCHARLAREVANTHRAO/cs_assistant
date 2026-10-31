# mobile/

Expo SDK 54 (React Native + TypeScript) app — runs on Android, iOS, and web.

## Folder Structure

```
mobile/
├── App.tsx                    ← Root: NavigationContainer + SafeAreaProvider
├── app.json                   ← Expo config (name, bundle ID, splash, icons)
├── package.json
├── tsconfig.json
├── vercel.json                ← Web deployment config (Vercel)
├── .env                       ← EXPO_PUBLIC_API_URL (not committed)
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx   ← Bottom tab navigator (Chat / Documents / Weather)
    ├── screens/
    │   ├── ChatScreen.tsx     ← Main chat UI with message history
    │   ├── DocumentsScreen.tsx ← Upload/list/delete documents
    │   └── WeatherScreen.tsx  ← City search + weather display
    ├── components/
    │   ├── MessageBubble.tsx  ← Single chat message (user = purple, bot = dark)
    │   ├── DocumentCard.tsx   ← Row with filename + delete button
    │   └── WeatherWidget.tsx  ← Weather card (temp, description, stats)
    └── services/
        └── api.ts             ← Axios client for all backend calls
```

## Running on Your Phone (Local Dev)

1. Install **Expo Go** on your phone (Android: Play Store / iOS: App Store).

2. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

3. Set backend URL in `mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

4. Connect phone via ADB wireless debugging:
   ```bash
   # Replace with your phone's IP:port shown in Developer Options
   adb connect 192.168.x.x:PORT

   # Tunnel so phone can reach localhost:8000
   adb reverse tcp:8000 tcp:8000
   adb reverse tcp:8081 tcp:8081
   ```

5. Start Expo:
   ```bash
   npx expo start
   ```

6. Scan the QR code with Expo Go. The app connects to your local backend through ADB.

## Using the Cloud Backend

Change `mobile/.env` to point to Render:
```
EXPO_PUBLIC_API_URL=https://my-assistant-backend-nxwg.onrender.com
```

Then restart Expo (`r` in the terminal to reload).

## Supported Document Types

PDF, DOCX, TXT, Markdown, and images (JPG, PNG, etc.) — the `+` button on the Documents screen opens the system file picker for all file types.

## Design System

- Dark theme: background `#1a1a2e`, cards `#2a2a3e`
- Accent: `#6C63FF` (purple) for buttons and user bubbles
- Icons: `@expo/vector-icons` Ionicons

## Deploy to Web (Vercel)

The app can be exported as a static web app and deployed to Vercel.

1. Push `mobile/` to a GitHub repo (e.g. `my-assistant-mobile`).
2. Import the repo in [vercel.com](https://vercel.com).
3. Vercel uses `vercel.json`:
   ```json
   {
     "buildCommand": "npx expo export --platform web",
     "outputDirectory": "dist"
   }
   ```
4. Add `EXPO_PUBLIC_API_URL` as an environment variable in Vercel pointing to the Render backend.

## Building a Native APK (Android)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

iOS build requires an Apple Developer account.

## On-Device Local Model

The mobile app now includes a native on-device GGUF model screen using `llama.rn`.
This does **not** run in Expo Go. Use a custom/native Android build.

Local Android build requirements:

```powershell
# Required once on the machine
# Install Android Studio or Android SDK command-line tools.
# Set ANDROID_HOME to the SDK path, for example:
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"

# Use a 64-bit JDK 17
$env:JAVA_HOME="C:\Program Files\JetBrains\PyCharm Community Edition 2022.2\jbr"
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

Build/run:

```powershell
npm.cmd install
npx.cmd expo prebuild --platform android --no-install
npx.cmd expo run:android
```

In the app, open **Home -> Local Model**, import a `.gguf` file such as
`Qwen3.5-2B-Q4_K_M.gguf`, tap **Load**, then chat offline.
