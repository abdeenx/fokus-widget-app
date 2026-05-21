#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIDGET_DIR="$SCRIPT_DIR/artifacts/widget-app"

echo "› Prebuild (generating native iOS project)..."
cd "$WIDGET_DIR"
npx expo prebuild --platform ios --no-install

echo "› Installing dependencies from workspace root..."
cd "$SCRIPT_DIR"
npm install

echo "› Building and installing on device..."
cd "$WIDGET_DIR"
npx expo run:ios --device --no-install
