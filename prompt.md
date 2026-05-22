# Build "Fokus" — a Daily Focus iPhone App with Native iOS Widget

You are building a React Native (Expo) iPhone app called **Fokus**. The app lets a user set one short "focus" for the day (a task, goal, quote, or reminder) and displays it on their iPhone home screen via a native iOS WidgetKit widget that updates in real time.

This must be a **standard Expo project** — a single root `package.json`, plain npm for package management, **no monorepo, no workspaces, no `scripts/` folder, no `artifacts/` folder**. Just the conventional Expo Router project layout at the repo root.

---

## Tech Stack (use exactly this)

- **Expo SDK ~54** with **Expo Router ~6** (file-based routing)
- **React Native 0.81.x**, **React 19.1.0**, **React DOM 19.1.0**
- **TypeScript ~5.9**
- **AsyncStorage** (`@react-native-async-storage/async-storage`) for all persistence — no backend, no database
- **React Context** for global state
- **expo-linear-gradient** for widget preview gradients
- **expo-haptics** for tap feedback
- **@expo/vector-icons** for icons
- **Native iOS widget** via WidgetKit (Swift / SwiftUI), wired in through a custom Expo config plugin
- Package manager: **npm** (no pnpm, no yarn)

Do **not** introduce: monorepos, pnpm workspaces, OpenAPI codegen, Drizzle, Express, Vite, Tailwind, Radix UI, or any backend services. Frontend-only.

---

## Project Structure (place everything at the repo root)

```
fokus/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root stack + FocusProvider wrapper
│   ├── +not-found.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Single-slot tab group (no visible tab bar)
│   │   └── index.tsx             # Home — current focus + history list
│   ├── edit.tsx                  # Modal — set/edit today's focus
│   ├── guide.tsx                 # Step-by-step "Add widget to home screen" guide
│   └── settings.tsx              # Clear history, theme, about
├── components/
│   ├── WidgetPreview.tsx         # In-app mock of the iOS widget (Small/Medium/Large)
│   ├── HistoryItem.tsx           # Row in the history list
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   └── KeyboardAwareScrollViewCompat.tsx
├── context/
│   └── FocusContext.tsx          # Global state (current focus + history) + AsyncStorage + native widget bridge
├── hooks/
│   └── useColors.ts              # Returns light/dark color set based on system theme
├── constants/
│   └── colors.ts                 # Design tokens (light + dark)
├── plugins/
│   └── withFokusWidget.js        # Expo config plugin — adds the WidgetKit extension at prebuild time
├── target/
│   └── FokusWidget/              # Swift source for the widget extension (copied into ios/ by the plugin)
│       ├── FokusWidget.swift     # Timeline provider + SwiftUI views for Small/Medium/Large
│       ├── FokusWidgetBundle.swift
│       └── Info.plist
├── assets/
│   └── images/
│       └── icon.png              # App icon (use a simple indigo square placeholder)
├── app.json
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
├── ios-device.sh                 # Convenience script to prebuild + run on physical iPhone
└── README.md
```

---

## App Configuration

### `app.json`

```json
{
  "expo": {
    "name": "Fokus",
    "slug": "fokus",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "fokus",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.example.fokus"
    },
    "android": {
      "package": "com.example.fokus"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "./plugins/withFokusWidget"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

> Bundle identifier and App Group ID must match: `com.example.fokus` and `group.com.example.fokus`. Change them consistently in `app.json`, `plugins/withFokusWidget.js`, `target/FokusWidget/Info.plist`, and `target/FokusWidget/FokusWidget.swift`.

### `package.json` (root, plain npm — no workspaces)

```json
{
  "name": "fokus",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "ios:device": "bash ios-device.sh",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "expo": "~54.0.27",
    "expo-blur": "~15.0.8",
    "expo-constants": "~18.0.11",
    "expo-font": "~14.0.10",
    "expo-haptics": "~15.0.8",
    "expo-linear-gradient": "~15.0.8",
    "expo-linking": "~8.0.10",
    "expo-router": "~6.0.17",
    "expo-splash-screen": "~31.0.12",
    "expo-status-bar": "~3.0.9",
    "expo-system-ui": "~6.0.9",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~19.1.10",
    "typescript": "~5.9.2"
  },
  "private": true
}
```

---

## Domain Model

```ts
// context/FocusContext.tsx
export type FocusCategory = "focus" | "goal" | "quote" | "reminder";

export interface FocusItem {
  id: string;            // uuid or timestamp string
  text: string;          // 1–140 chars
  category: FocusCategory;
  createdAt: string;     // ISO 8601
}

interface FocusContextValue {
  current: FocusItem | null;
  history: FocusItem[];                // capped at 20 items, newest first
  setFocus: (text: string, category: FocusCategory) => Promise<void>;
  activateHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}
```

**AsyncStorage keys:**
- `@fokus/current` → JSON-stringified `FocusItem`
- `@fokus/history` → JSON-stringified `FocusItem[]`

**Behavior:**
- `setFocus` creates a new `FocusItem`, sets it as `current`, pushes the *previous* current (if any) onto `history`, dedupes by text, and trims history to 20.
- `activateHistoryItem` moves that item back to `current` and rotates the old current into history.
- After any state change, call `tryUpdateNativeWidget(current)` which calls the native bridge if available and silently no-ops in Expo Go.

---

## Screens

### `app/(tabs)/index.tsx` — Home

- Greeting header with date.
- Big card showing current focus (or empty state with "Set today's focus" button → `/edit`).
- `WidgetPreview` component showing how it'll look on the home screen (toggle between Small / Medium / Large).
- "View history" section with category filter chips (All / Focus / Goal / Quote / Reminder).
- Tap a history item → makes it active again.
- Floating action button → `/edit`.

### `app/edit.tsx` — Edit (presented as modal)

- TextInput (multiline, 140-char limit, character counter).
- Category picker: 2x2 grid of `Today's Focus`, `Goal`, `Quote`, `Reminder` (each with icon, label, short description).
- Live `WidgetPreview` updates as you type.
- "Save" button (disabled if empty) — calls `setFocus`, triggers haptic, navigates back.

### `app/guide.tsx` — Guide

- Numbered step-by-step instructions for adding the widget to the iPhone home screen (long-press → + → search "Fokus" → pick size → Add Widget).
- Illustrative `WidgetPreview` at the top.

### `app/settings.tsx` — Settings

- "Clear history" with confirmation alert.
- Link to `/guide`.
- App version and a short About section.

### `app/(tabs)/_layout.tsx`

- Single Tabs slot — the tab bar is hidden (`tabBarStyle: { display: "none" }`). This keeps the file-based routing clean while presenting as a stack-style app.

### `app/_layout.tsx`

- `<FocusProvider>` wrapping `<Stack>`.
- Stack screens: `(tabs)` (no header), `edit` (modal presentation), `guide` (default header), `settings` (default header), `+not-found`.
- Status bar auto.
- `GestureHandlerRootView` at the root.

---

## Design

**Theme:** Indigo + amber, supports light and dark.

`constants/colors.ts`:

```ts
export default {
  light: {
    primary: "#4F46E5",        // indigo-600
    primaryFg: "#FFFFFF",
    accent: "#F59E0B",         // amber-500
    background: "#F5F4FB",
    surface: "#FFFFFF",
    foreground: "#0F0E17",
    muted: "#6B7280",
    border: "#E5E7EB",
    gradient: ["#6366F1", "#4F46E5", "#4338CA"] as const,
  },
  dark: {
    primary: "#818CF8",
    primaryFg: "#0F0E17",
    accent: "#FBBF24",
    background: "#0F0E17",
    surface: "#1A1A2E",
    foreground: "#F5F4FB",
    muted: "#9CA3AF",
    border: "#2A2A3E",
    gradient: ["#4338CA", "#4F46E5", "#6366F1"] as const,
  },
  radius: 14,
} as const;
```

`hooks/useColors.ts` returns the appropriate set via `useColorScheme()`.

**WidgetPreview proportions** (mirror real WidgetKit sizes):
- Small: 155×155
- Medium: 329×155
- Large: 329×345

Use `expo-linear-gradient` with the theme's `gradient` array, indigo for the background. White text. Category icon in the top-left. Date/time stamp in the bottom-right (small view shows only icon + text).

---

## Native iOS Widget

### `plugins/withFokusWidget.js`

An Expo config plugin that runs during `expo prebuild` and:

1. **Adds the App Group entitlement** `group.com.example.fokus` to the main app target's `.entitlements` file.
2. **Copies** everything in `target/FokusWidget/` into `ios/FokusWidget/` in the generated Xcode project.
3. **Registers an Xcode `app-extension` target** named `FokusWidget` in the `.pbxproj`, with the same App Group entitlement, deployment target iOS 17.
4. **Generates a native bridge module** in the main app target:
   - `FokusWidgetBridge.h` / `FokusWidgetBridge.m` — exposes `updateData:(NSString *)json` to React Native.
   - Implementation writes the JSON string to shared `UserDefaults(suiteName: "group.com.example.fokus")` under key `fokusData`, then calls `WidgetCenter.shared.reloadAllTimelines()`.

Use Expo's modular config plugin helpers: `withEntitlementsPlist`, `withXcodeProject`, `withDangerousMod`. Reference Expo's documented plugin API. The plugin must be idempotent (safe to run multiple times).

### `target/FokusWidget/FokusWidget.swift`

```swift
import WidgetKit
import SwiftUI

let AppGroupID = "group.com.example.fokus"

struct FokusData: Codable {
    var text: String
    var category: String     // "focus" | "goal" | "quote" | "reminder"
    var lastUpdated: String  // ISO 8601
}

struct FokusEntry: TimelineEntry {
    let date: Date
    let data: FokusData
}

struct FokusProvider: TimelineProvider {
    func placeholder(in context: Context) -> FokusEntry { /* sample */ }
    func getSnapshot(in context: Context, completion: @escaping (FokusEntry) -> Void) { /* read shared defaults */ }
    func getTimeline(in context: Context, completion: @escaping (Timeline<FokusEntry>) -> Void) {
        // Read from UserDefaults(suiteName: AppGroupID), key "fokusData"
        // Build single-entry timeline that refreshes every 30 minutes (.after(Date().addingTimeInterval(1800)))
    }
}

struct FokusSmallView: View { /* ... */ }
struct FokusMediumView: View { /* ... */ }
struct FokusLargeView: View { /* ... */ }

struct FokusWidgetEntryView: View {
    var entry: FokusProvider.Entry
    @Environment(\.widgetFamily) var family
    var body: some View {
        switch family {
        case .systemSmall:  FokusSmallView(entry: entry)
        case .systemMedium: FokusMediumView(entry: entry)
        case .systemLarge:  FokusLargeView(entry: entry)
        default:            FokusSmallView(entry: entry)
        }
    }
}

struct FokusWidget: Widget {
    let kind = "FokusWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FokusProvider()) { entry in
            FokusWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Fokus")
        .description("Your daily focus, always visible.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
```

Use an indigo `LinearGradient` background (`#6366F1 → #4338CA`). White text. SF Symbol per category (`target`, `flag.fill`, `quote.bubble.fill`, `bell.fill`). Small view: icon + truncated text. Medium view: icon + label + full text. Large view: icon + label + full text + "Last updated" timestamp + small accent footer.

### `target/FokusWidget/FokusWidgetBundle.swift`

```swift
import WidgetKit
import SwiftUI

@main
struct FokusWidgetBundle: WidgetBundle {
    var body: some Widget { FokusWidget() }
}
```

### `target/FokusWidget/Info.plist`

Standard widget extension Info.plist with `NSExtensionPointIdentifier = com.apple.widgetkit-extension`, an `FokusAppGroupID` string set to `group.com.example.fokus`, display name `Fokus`.

### Bridging from JS

In `context/FocusContext.tsx`:

```ts
import { NativeModules } from "react-native";

function tryUpdateNativeWidget(item: FocusItem | null) {
  try {
    const bridge = (NativeModules as any).FokusWidgetBridge;
    if (!bridge || !bridge.updateData) return; // Expo Go: silently no-op
    const payload = item
      ? JSON.stringify({ text: item.text, category: item.category, lastUpdated: item.createdAt })
      : JSON.stringify({ text: "", category: "focus", lastUpdated: new Date().toISOString() });
    bridge.updateData(payload);
  } catch {
    // Never crash in Expo Go
  }
}
```

Call this from `setFocus`, `activateHistoryItem`, and `clearHistory` after the AsyncStorage write.

---

## `ios-device.sh` (root)

```bash
#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "› Prebuild (generating native iOS project)..."
npx expo prebuild --platform ios --no-install

echo "› Installing dependencies..."
npm install

echo "› Building and installing on device..."
npx expo run:ios --device --no-install
```

Mark executable in the README instructions (`chmod +x ios-device.sh`).

---

## README.md (must include)

1. **What it is** — one-paragraph description.
2. **Run in Expo Go** — `npm install`, then `npx expo start`, scan QR with Expo Go. The widget itself won't appear in Expo Go (WidgetKit extensions require a native build), but the full app UI works.
3. **Native iOS build on a physical iPhone:**
   - Prereqs: macOS, Xcode 15+, Xcode CLI tools, a free Apple Developer account, iPhone connected by USB.
   - Trust the Mac on the iPhone when prompted.
   - `npm install && npm run ios:device`
   - First launch: Settings → General → VPN & Device Management → trust the developer cert.
   - Add the widget: long-press home screen → + → search "Fokus" → pick size → Add Widget.
4. **JS-only iterations** — after first install, just keep Metro running and edit JS. Native code changes (`plugins/`, `target/`, `app.json` plugin list) require rerunning `npm run ios:device`.
5. **Project structure** — annotated tree.
6. **Customizing the widget** — how to edit `FokusWidget.swift`, what `FokusData` looks like, how to add a new field (update Swift struct + TS interface + JSON serialization).
7. **Changing the bundle ID / App Group** — list all four places to update consistently.
8. **Troubleshooting** — Xcode CLI tools missing, signing errors (open `ios/Fokus.xcworkspace` in Xcode → Signing & Capabilities → set team), widget not appearing, widget shows placeholder.

---

## Key Gotchas to Bake In

- **App Group ID must match exactly** in all four locations (`app.json` bundleId derives it, `withFokusWidget.js` references it, `Info.plist` lists it, `FokusWidget.swift` constant). Mismatches mean the widget reads stale/empty data with no error.
- **Never edit `ios/` manually** — it's regenerated by `expo prebuild`. All native changes belong in `target/`, `plugins/`, or `app.json`.
- **Native bridge calls must be wrapped in try/catch** so Expo Go never crashes on missing `NativeModules.FokusWidgetBridge`.
- **History dedupe by text** so re-saving the same focus doesn't pollute history.
- **Cap history at 20 items**, newest first.
- **Widget refresh cadence** — iOS controls this (~30 min). The native bridge calls `WidgetCenter.shared.reloadAllTimelines()` to force an immediate refresh whenever focus changes.
- **Do not create `app.config.ts`** — keep `app.json` static (EAS / Expo Launch compatibility).
- **iOS 17+ deployment target** for the widget extension (uses `containerBackground`).

---

## Acceptance Criteria

- `npm install && npx expo start` works; app loads in Expo Go with full UI (widget bridge no-ops gracefully).
- `npm run ios:device` on a Mac with a connected iPhone produces an installable build, the app launches, and the Fokus widget appears in the home-screen widget gallery in all three sizes.
- Saving a focus in the app updates the widget on the home screen within ~1 second (via `reloadAllTimelines`).
- History supports filter chips, dedupe, and the 20-item cap.
- Dark mode and light mode both look polished (no contrast issues on the indigo gradient).
- `npm run typecheck` passes with zero errors.

---

## Out of Scope (do not build)

- Any backend, API server, or database.
- Authentication or user accounts.
- Multi-device sync.
- Android widget (Android app should still install and run, but the home-screen widget is iOS-only for this version).
- Push notifications.
- Monorepo / workspaces / pnpm.
