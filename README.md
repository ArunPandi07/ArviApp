# ArviniXApp

A React Native voice billing assistant application with multilingual support (6 Indian languages + English), local database via WatermelonDB, and PDF invoice generation.

![React Native](https://img.shields.io/badge/React_Native-0.85.2-%61DAFB)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Project Overview

**ArviniXApp** is a cross-platform mobile application for retail shops that enables voice-based bill creation with regional language support. The app supports Tamil, Hindi, Telugu, Kannada, Malayalam, and English. It uses WatermelonDB for local data persistence, React Navigation for navigation, and integrates with Ollama LLMs for voice-to-text bill item extraction.

### Key Features

- **Multilingual UI**: 6 languages with full translations (Tamil, Hindi, Telugu, Kannada, Malayalam, English)
- **Voice Billing**: Voice-to-text bill item extraction using Ollama local LLM
- **Local Database**: WatermelonDB with SQLite adapter for offline-first data
- **PDF Invoices**: Generate professional invoice PDFs with billing data
- **WhatsApp Sharing**: Share invoices directly via WhatsApp
- **Offline First**: All data stored locally, sync capability when backend is available
- **State Management**: Zustand with AsyncStorage persistence

---

## Technologies & Exact Versions

| Category | Package | Version |
|---|---|---|
| **Runtime** | react | 19.2.3 |
| | react-native | 0.85.2 |
| **Database** | @nozbe/watermelondb | ^0.27.1 |
| **Storage** | @react-native-async-storage/async-storage | ^1.24.0 |
| **Voice** | @react-native-voice/voice | ^3.2.4 |
| **Navigation** | @react-navigation/native | ^7.2.4 |
| | @react-navigation/native-stack | ^7.3.8 |
| | @react-navigation/bottom-tabs | ^7.15.13 |
| **UI** | react-native-gesture-handler | ^2.31.2 |
| | react-native-html-to-pdf | ^1.3.0 |
| | react-native-linear-gradient | ^2.8.3 |
| | react-native-safe-area-context | ^5.7.0 |
| | react-native-screens | ^4.24.0 |
| | react-native-share | ^12.3.1 |
| | react-native-vector-icons | ^10.3.0 |
| **State** | zustand | ^4.5.2 |
| **Dev** | @react-native-community/cli | 20.1.0 |
| | @types/react | ^19.2.0 |
| | @types/react-test-renderer | ^19.1.0 |
| | typescript | ^5.8.3 |
| | jest | ^29.6.3 |
| | eslint | ^8.19.0 |
| | prettier | 2.8.8 |

**Engines**: Node.js >= 22.11.0

---

## Project Structure

```
ArviniXApp/
├── __tests__/              # Test files
├── .bundle/                # Ruby bundle config
├── .gitignore
├── .eslintrc.js            # ESLint config
├── .prettierrc.js          # Prettier config
├── .watchmanconfig         # Watchman config
├── android/                # Native Android project
├── ios/                    # Native iOS project
├── app.json                # Expo app config
├── Gemfile                 # CocoaPods dependencies
├── index.js                # App entry point
├── index.ts (implied)      # TypeScript root entry
├── package.json            # Dependencies & scripts
├── package-lock.json       # Lock file
├── README.md               # This file
├── tsconfig.json           # TypeScript config
├── babel.config.js         # Babel configuration
├── metro.config.js         # Metro configuration
└── src/
    ├── constants/
    │   ├── index.ts        # Colors, spacing, radius, languages, translations
    │   └── theme.ts        # Design tokens (colors, spacing, radius, font sizes)
    ├── db/
    │   ├── index.ts        # Database instance (SQLite adapter + Database singleton)
    │   ├── schema.ts       # WatermelonDB schema (bills, bill_items, products)
    │   └── models/
    │       ├── Bill.ts
    │       ├── BillItem.ts
    │       └── Product.ts
    ├── navigation/
    │   ├── AppNavigator.tsx # Main navigator (stack + bottom tabs)
    │   └── types.ts         # Navigation param types
    ├── services/
    │   ├── api.ts          # FastAPI backend stub (BASE_URL placeholder)
    │   ├── invoice.ts      # PDF generation + WhatsApp sharing
    │   └── llm.ts          # Ollama LLM for voice → bill items
    ├── store/
    │   └── appStore.ts     # Zustand with AsyncStorage persistence
    └── screens/
        ├── SplashScreen.tsx
        ├── LanguageScreen.tsx
        ├── LoginScreen.tsx
        ├── DashboardScreen.tsx
        ├── NewBillScreen.tsx
        ├── VoiceBillingScreen.tsx
        ├── InvoiceScreen.tsx
        └── BillsScreen.tsx
```

---

## Environment Configuration

### Prerequisites

1. **Node.js**: Version >= 22.11.0 (specified in `package.json` engines field)
2. **Ruby**: For CocoaPods iOS dependency installation
3. **CocoaPods**: `gem install cocoapods` (iOS only)
4. **Android Studio**: For Android emulator/device deployment
5. **Xcode**: For iOS deployment (macOS only)
6. **Ollama**: Local LLM server for voice processing (optional, see LLM config below)

### Node Dependencies

```bash
npm install
# or
yarn install
```

This will install all dependencies listed in `package.json` and `package-lock.json`.

### iOS CocoaPods

```bash
cd ios && bundle exec pod install
```

### Ollama LLM Configuration

The app uses Ollama local LLM for voice-to-bill item extraction. Configuration is in `src/services/llm.ts`:

- **Emulator (PC localhost)**: `http://10.0.2.2:11434`
- **Real device (WiFi)**: Use your PC's LAN IP, e.g., `http://192.168.1.x:11434`
- **Model**: `llama3.2` (configure in `llm.ts`)
- **Timeout**: 30 seconds

Ensure Ollama is running and the model is pulled before using voice billing features.

---

## Installation Steps

### 1. Clone the repository

```bash
git clone <repository-url>
cd ArviniXApp
```

### 2. Install npm dependencies

```bash
npm install
```

### 3. Install iOS CocoaPods dependencies

```bash
cd ios && bundle exec pod install
cd ..
```

### 4. Verify Ollama (optional for voice features)

```bash
# Start Ollama if not running
ollama serve

# Pull the model if not already installed
ollama pull llama3.2
```

### 5. Run the app

**Android**:

```bash
npm run android
# or
react-native run-android
```

**iOS**:

```bash
npm run ios
# or
react-native run-ios
```

---

## Available Commands

| Command | Description |
|---|---|
| `npm start` | Start Metro development server |
| `npm run android` | Build and run on Android emulator/device |
| `npm run ios` | Build and run on iOS simulator/device |
| `npm run lint` | Run ESLint on source files |
| `npm test` | Run Jest test suite |

---

## Development Workflow

### Start Metro Server

```bash
npm start
```

Keep this running while developing. Changes to JavaScript/TypeScript files will trigger Fast Refresh.

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

---

## Backup & Restoration Instructions

### Purpose

This documentation ensures the project can be fully restored on another laptop without missing dependencies, configurations, or setup instructions.

### What to Backup

1. **Project Source Code**: The entire `ArviniXApp/` directory (excluding `node_modules/`)
   - Contains all TypeScript source, navigation, services, screens, and constants
   
2. **Dependency Lock File**: `package-lock.json` (or `yarn.lock`)
   - Ensures exact versions are installed on restoration
   
3. **Gemfile & Gemfile.lock**: For CocoaPods iOS dependencies
   - Located at project root `Gemfile` and `ios/Gemfile.lock`
   
4. **Android & iOS Native Folders**:
   - `android/` - Native Android project files
   - `ios/` - Native iOS project files (includes `Pods/` after `pod install`)
   
5. **Ollama Configuration**:
   - `src/services/llm.ts` - LLM URL and model configuration
   - Ollama local server + model (llama3.2)
   
6. **Environment Notes**:
   - No `.env` file exists; all configuration is in source code
   - Node.js version >= 22.11.0 required
   - Ruby + CocoaPods for iOS builds

### Restoration Procedure

#### On the New Laptop:

1. **Clone/re-copy the project**

   ```bash
   git clone <repository-url>
   cd ArviniXApp
   ```

2. **Install Node.js**

   Install Node.js version >= 22.11.0 via nvm or your preferred method.

3. **Install npm dependencies**

   ```bash
   npm install
   ```

   This reads `package-lock.json` to install exact versions.

4. **Install CocoaPods (iOS)**

   ```bash
   cd ios && bundle exec pod install
   cd ..
   ```

   You need Ruby installed for this step.

5. **Set up Ollama (if using voice features)**

   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh

   # Start Ollama
   ollama serve

   # Pull the model
   ollama pull llama3.2
   ```

6. **Verify configuration**

   - Check `src/services/llm.ts` for Ollama URL (default: `http://10.0.2.2:11434` for emulator, or use your PC's LAN IP for real devices)
   - Verify `Gemfile` is intact for CocoaPods

7. **Run the app**

   **Android**:
   ```bash
   npm run android
   ```

   **iOS**:
   ```bash
   npm run ios
   ```

8. **Restore persisted state (Zustand + AsyncStorage)**

   The app uses Zustand with AsyncStorage persistence. The stored state key is `ai-store-app-storage`. After reinstalling:
   - Launch the app and complete the login flow
   - The stored language preference, shop name, phone, and auth state will be restored from local storage
   - If AsyncStorage data appears lost, ensure `@react-native-async-storage/async-storage` is properly installed

### Notes on Data Persistence

- **WatermelonDB**: Local SQLite database (`AIStoreDB`) stored in the app's sandbox. Data persists across app restores unless the database file is deleted.
- **Zustand + AsyncStorage**: User preferences (language, shop info, login state) are persisted. On fresh install, the app starts with default values (`lang: 'ta'`, `shopName: 'My Store'`, `shopCity: 'Chennai'`).
- **No external backend required**: All data is local. The FastAPI backend (`src/services/api.ts`) is stubbed and not required for core functionality.

### What NOT to Backup/Restore

- `node_modules/` - Regenerated by `npm install`
- `.cache/` or `.hermes-cache/` - Generated by Metro/Runtime
- `android/app/build/` and `ios/build/` - Build artifacts
- Environment-specific secrets (none found in codebase; no `.env` file present)

---

## Deployment

### Android Deployment

```bash
# Build release APK
cd android
./gradlew assembleRelease
# APK output: app/build/outputs/apk/release/app-release.apk
```

### iOS Deployment

```bash
# Install pods (if not already)
cd ios
bundle exec pod install

# Build
xcodebuild -workspace ArviniXApp.xcworkspace \
  -scheme ArviniXApp \
  -configuration Release \
  -sdk iphoneos \
  archive \
  -archivePath build/ArviniXApp.xcarchive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/ArviniXApp.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist exportOptions.plist
```

### Expo Alternative

If using Expo workflow, `app.json` is configured. Run:

```bash
npm install -g expo-cli
expo start
# or
npx expo run-android
# or
npx expo run-ios
```

---

## License

MIT