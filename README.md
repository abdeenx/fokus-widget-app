# Fokus

A React Native (Expo) app that puts your daily focus on your iPhone home screen as a native iOS widget. Set a task, goal, quote, or reminder — it shows up on your home screen and updates automatically.

---

## Getting started

Install dependencies and start the dev server:

```bash
pnpm install
pnpm --filter @workspace/widget-app run dev
```

Scan the QR code with the **Expo Go** app on your iPhone or Android device. The full app UI works in Expo Go. The native iOS widget requires a production build (see the Widget section below).

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
pnpm --filter @workspace/api-server run dev
```

Add routes in `artifacts/api-server/src/routes/`. Follow the `pnpm-workspace` skill for the OpenAPI-first contract pattern if you add new endpoints.

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `pnpm --filter @workspace/widget-app run dev` | Start Expo dev server |
| `pnpm --filter @workspace/api-server run dev` | Start API server |
| `pnpm run typecheck` | Full TypeScript check across all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client hooks from OpenAPI spec |
