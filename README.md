# Fokus

A React Native (Expo) app that puts your daily focus on your iPhone home screen as a native iOS widget. Set a task, goal, quote, or reminder — it shows up on your home screen and updates automatically.

---

## Getting started

Install dependencies and start the dev server:

```bash
npm install
npm run start --workspace @workspace/widget-app
```

Scan the QR code with the **Expo Go** app on your iPhone or Android device. The full app UI works in Expo Go. The native iOS widget requires a production build (see the Widget section below).

> **Note:** The `dev` script is for running inside Replit (it sets Replit-specific proxy env vars). Use `start` when developing locally on your machine.

---

## Running a native build on your iPhone (cable)

This is required to test the **iOS widget** — Expo Go does not support WidgetKit extensions. A local native build compiles the full app including the widget extension and installs it directly to your connected iPhone.

### Prerequisites

- **Xcode 15 or later** — install from the Mac App Store
- **Xcode Command Line Tools** — run `xcode-select --install` if you haven't already
- **A free or paid Apple Developer account** — a free account is enough for sideloading to your own device (no App Store submission needed)
- Your iPhone connected to your Mac via USB cable, with the screen unlocked

### 1. Trust your Mac on the iPhone

The first time you connect, a prompt will appear on your iPhone asking *"Trust This Computer?"* — tap **Trust** and enter your passcode.

### 2. Install dependencies (if you haven't already)

```bash
npm install
```

### 3. Build and run on your device

From the **repo root** (`fokus-widget-app/`), run:

```bash
npm run ios:device
```

This runs `ios-device.sh`, which does three things in the correct order:
1. **`expo prebuild`** — `cd`s into `artifacts/widget-app` and generates the native `ios/` Xcode project, wiring up the widget extension, App Group entitlement, and native bridge via the config plugin
2. **`npm install`** — returns to the repo root and installs any dependency changes
3. **`expo run:ios --device --no-install`** — compiles with Xcode, installs to your iPhone, and starts Metro

> If you have multiple connected devices, Expo will prompt you to pick one. Select your iPhone from the list.

### 4. Trust the developer certificate on your iPhone

On first launch you may see *"Untrusted Developer"*. To fix it:

1. On your iPhone go to **Settings → General → VPN & Device Management**
2. Tap your Apple ID under *Developer App*
3. Tap **Trust** → **Trust**

Then open Fokus from your home screen — it will launch normally.

### 5. Add the widget to your home screen

1. Long-press an empty area of your home screen until icons jiggle
2. Tap the **+** button (top-left)
3. Search for **Fokus**
4. Choose a size (Small, Medium, or Large) and tap **Add Widget**

Set a focus in the app — the widget updates immediately.

### Subsequent runs

After the first build, you only need to rerun the full build if you change native code (the config plugin, Swift widget files, or `app.json` plugins). For JS-only changes, just keep Metro running and save your files — the app reloads automatically.

To rebuild (from the repo root):

```bash
npm run ios:device
```

To start Metro without rebuilding (after the app is already installed on your iPhone):

```bash
cd artifacts/widget-app
npx expo start --dev-client
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `xcode-select: error` | Run `xcode-select --install` |
| Build fails with signing error | Open `ios/fokus.xcworkspace` in Xcode → select your target → Signing & Capabilities → set your Apple ID team |
| Widget not appearing in gallery | Make sure you opened the app at least once after installing; wait a few seconds for WidgetKit to index it |
| Widget shows placeholder text | Open the app, set a focus, and wait ~30 seconds for the widget to refresh |
| Metro can't connect | Ensure your iPhone and Mac are on the same Wi-Fi, or keep the USB cable connected |

---

## Project structure

```
artifacts/
  widget-app/          # The Expo mobile app
    app/               # Screens (Expo Router)
      (tabs)/
        index.tsx      # Home screen
      edit.tsx         # Edit focus (modal)
      guide.tsx        # Widget setup guide
      settings.tsx     # App settings
    components/
      WidgetPreview.tsx # In-app iOS widget mock
      HistoryItem.tsx   # History list row
    context/
      FocusContext.tsx  # Global state + AsyncStorage persistence
    constants/
      colors.ts        # Design tokens (light + dark themes)
    plugins/
      withFokusWidget.js  # Expo config plugin for the native widget
    target/
      FokusWidget/     # Swift/SwiftUI widget extension source
        FokusWidget.swift
        FokusWidgetBundle.swift
        Info.plist
  api-server/          # Express API (currently health check only)
lib/
  api-spec/            # OpenAPI spec
  api-client-react/    # Auto-generated React Query hooks
```

---

## Developing the app

### Adding a new screen

Create a new file under `artifacts/widget-app/app/`:

```tsx
// artifacts/widget-app/app/my-screen.tsx
import { router } from "expo-router";
import { View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function MyScreen() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Hello</Text>
    </View>
  );
}
```

Then register it in `app/_layout.tsx` inside the `<Stack>`:

```tsx
<Stack.Screen name="my-screen" options={{ headerShown: false }} />
```

Navigate to it from anywhere:

```tsx
import { router } from "expo-router";
router.push("/my-screen");
```

### Changing the color theme

Edit `artifacts/widget-app/constants/colors.ts`. Both `light` and `dark` objects must define the same keys. The `useColors()` hook automatically returns the right set based on the device color scheme.

```ts
export default {
  light: {
    primary: "#4F46E5",
    background: "#F0EFF4",
    // ...
  },
  dark: {
    primary: "#818CF8",
    background: "#0F0E17",
    // ...
  },
  radius: 14,
};
```

### Adding a new focus category

1. Add the new key to the `FocusCategory` type in `context/FocusContext.tsx`.
2. Add an entry to the `CATEGORY_META` map in `components/WidgetPreview.tsx` (icon + label).
3. Add the category to the `CATEGORIES` array in `app/edit.tsx` (icon, label, description).
4. Update the `CATEGORY_FILTERS` array in `app/(tabs)/index.tsx`.
5. In `target/FokusWidget/FokusWidget.swift`, add a new `case` to the `categoryIcon()` and `categoryLabel()` helper functions.

### Persisting new data

All state lives in `context/FocusContext.tsx`. It uses `@react-native-async-storage/async-storage` with two keys:

| Key | Contents |
|-----|----------|
| `@fokus/current` | The active `FocusItem` as JSON |
| `@fokus/history` | Array of up to 20 `FocusItem` objects as JSON |

To add a new piece of persisted data, add an AsyncStorage key and manage it inside the context using the same `useEffect` / `useState` pattern already in place.

---

## Developing the iOS widget

### How the widget works

```
App (React Native)
  └─ FocusContext.setFocus()
       └─ AsyncStorage (local storage)
       └─ tryUpdateNativeWidget()   ← only active in native builds
            └─ NativeModules.FokusWidgetBridge.updateData(json)
                 └─ UserDefaults (App Group: group.com.replit.fokus)
                      └─ FokusWidget.swift (WidgetKit)
                           └─ iPhone home screen widget
```

In **Expo Go**, data is saved to AsyncStorage only — the widget bridge call is silently skipped. In a **production build** (Expo Launch / EAS), the native bridge is compiled in and the widget updates immediately every time you save a new focus.

### Widget source files

All widget Swift source lives in `artifacts/widget-app/target/FokusWidget/`. These files are copied into the Xcode project automatically by the config plugin during a native build.

| File | Purpose |
|------|---------|
| `FokusWidget.swift` | All widget logic: data model, timeline provider, and SwiftUI views for Small / Medium / Large |
| `FokusWidgetBundle.swift` | Entry point — registers `FokusWidget` with WidgetKit |
| `Info.plist` | Extension metadata and App Group ID |

### Modifying widget layouts

Open `target/FokusWidget/FokusWidget.swift`. Each size has its own SwiftUI view:

| View | Widget size |
|------|-------------|
| `FokusSmallView` | 2×2 (small) |
| `FokusMediumView` | 4×2 (medium) |
| `FokusLargeView` | 4×4 (large) |

Change colors, fonts, layout, or add new fields by editing these views. After editing, run a native build to see the changes on device.

The data model the widget reads is `FokusData`:

```swift
struct FokusData: Codable {
    var text: String       // The focus text
    var category: String   // "focus" | "quote" | "goal" | "reminder"
    var lastUpdated: String // ISO 8601 date string
}
```

To add a new field (e.g. a subtitle), update:
1. `FokusData` struct in `FokusWidget.swift`
2. `FocusItem` interface in `context/FocusContext.tsx`
3. The JSON serialization in `tryUpdateNativeWidget()` in `FocusContext.tsx`

### The config plugin

`plugins/withFokusWidget.js` runs at native build time and does four things:

1. **App Group entitlement** — adds `group.com.replit.fokus` to the main app's entitlements so it can share data with the widget extension.
2. **Copies Swift files** — copies everything in `target/FokusWidget/` into `ios/FokusWidget/` inside the generated Xcode project.
3. **Adds Xcode target** — registers a new `app-extension` target (`FokusWidget`) in the `.pbxproj` file.
4. **Native bridge module** — generates `FokusWidgetBridge.h` and `FokusWidgetBridge.m` inside the main app target, exposing `updateData(json)` to React Native.

If you change the App Group ID, update it in all four places:
- `app.json` → `ios.bundleIdentifier` (the plugin derives the group as `group.<bundleId>`)
- `plugins/withFokusWidget.js` (fallback string)
- `target/FokusWidget/Info.plist` → `FokusAppGroupID`
- `target/FokusWidget/FokusWidget.swift` → `AppGroupID` constant

### Building for a real device

1. Click **Publish** (Expo Launch) in the Replit interface.
2. Expo Launch runs EAS Build, which executes the config plugin and compiles the Swift widget.
3. Install the resulting `.ipa` on your iPhone.
4. Long-press your home screen → tap **+** → search **Fokus** → add the widget.

---

## API server

The `artifacts/api-server/` package is an Express 5 server that currently only serves a health check at `GET /api/healthz`. It is available if you need to add a backend — for example, syncing focus data across devices or adding user accounts.

Start it with:

```bash
npm run dev --workspace @workspace/api-server
```

Add routes in `artifacts/api-server/src/routes/`.

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `npm run start --workspace @workspace/widget-app` | Start Expo dev server |
| `npm run dev --workspace @workspace/api-server` | Start API server |
| `npm run typecheck` | Full TypeScript check across all packages |
| `npm run codegen --workspace @workspace/api-spec` | Regenerate API client hooks from OpenAPI spec |
