#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIDGET_DIR="$SCRIPT_DIR/artifacts/widget-app"
EXPO_BIN="$WIDGET_DIR/node_modules/.bin/expo"

# Clear pnpm env vars inherited from the parent `pnpm run` so nested
# pnpm/expo calls don't get confused about which workspace they're in.
unset npm_config_user_agent npm_lifecycle_event npm_lifecycle_script \
      npm_package_name npm_package_version npm_execpath npm_node_execpath \
      PNPM_SCRIPT_SRC_DIR PNPM_PACKAGE_NAME

if [ ! -x "$EXPO_BIN" ]; then
  echo "Error: expo binary not found at $EXPO_BIN" >&2
  echo "Run 'pnpm install' from the repo root first." >&2
  exit 1
fi

echo "› Prebuild (generating native iOS project)..."
cd "$WIDGET_DIR"
"$EXPO_BIN" prebuild --platform ios --no-install

echo "› Installing dependencies from workspace root..."
cd "$SCRIPT_DIR"
pnpm install

echo "› Building and installing on device..."
cd "$WIDGET_DIR"
"$EXPO_BIN" run:ios --device --no-install
