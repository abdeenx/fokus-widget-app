const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

/**
 * Expo Config Plugin: Fokus Widget Extension
 *
 * This plugin adds a native iOS WidgetKit extension to the app.
 * It requires a native build (Expo Launch / EAS Build) to activate.
 *
 * What it does:
 * 1. Adds App Group entitlement to the main app for shared data storage
 * 2. Copies Swift widget source files into the ios/ directory
 * 3. Adds the FokusWidget extension target to the Xcode project
 */

const WIDGET_TARGET_NAME = "FokusWidget";
const WIDGET_BUNDLE_SUFFIX = ".FokusWidget";

/**
 * Step 1: Add App Group entitlement to the main app
 */
function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    const bundleId =
      mod.ios?.bundleIdentifier ?? "com.replit.fokus";
    const appGroupId = `group.${bundleId}`;
    const key = "com.apple.security.application-groups";

    if (!Array.isArray(mod.modResults[key])) {
      mod.modResults[key] = [];
    }
    if (!mod.modResults[key].includes(appGroupId)) {
      mod.modResults[key].push(appGroupId);
    }
    return mod;
  });
}

/**
 * Step 2: Copy Swift widget source files into ios/<WidgetTargetName>/
 */
function withWidgetSourceFiles(config) {
  return withDangerousMod(config, [
    "ios",
    (mod) => {
      const iosDir = path.join(
        mod.modRequest.platformProjectRoot
      );
      const widgetDir = path.join(iosDir, WIDGET_TARGET_NAME);
      const sourceDir = path.join(
        mod.modRequest.projectRoot,
        "target",
        WIDGET_TARGET_NAME
      );

      if (!fs.existsSync(widgetDir)) {
        fs.mkdirSync(widgetDir, { recursive: true });
      }

      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir);
        for (const file of files) {
          fs.copyFileSync(
            path.join(sourceDir, file),
            path.join(widgetDir, file)
          );
        }
      }

      return mod;
    },
  ]);
}

/**
 * Step 3: Add widget extension target to Xcode project
 */
function withWidgetXcodeTarget(config) {
  return withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const bundleId =
      mod.ios?.bundleIdentifier ?? "com.replit.fokus";
    const widgetBundleId = bundleId + WIDGET_BUNDLE_SUFFIX;

    // Check if target already added
    const targets = xcodeProject.pbxNativeTargetSection();
    const alreadyAdded = Object.values(targets).some(
      (t) => t && t.name === WIDGET_TARGET_NAME
    );
    if (alreadyAdded) return mod;

    try {
      const widgetUUID = xcodeProject.generateUuid();
      const buildConfigListUUID = xcodeProject.generateUuid();
      const debugBuildUUID = xcodeProject.generateUuid();
      const releaseBuildUUID = xcodeProject.generateUuid();
      const sourcesPhaseUUID = xcodeProject.generateUuid();
      const resourcesPhaseUUID = xcodeProject.generateUuid();

      // Add build configurations
      xcodeProject.pbxXCBuildConfigurationSection()[debugBuildUUID] = {
        isa: "XCBuildConfiguration",
        buildSettings: {
          ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES: "NO",
          APPLICATION_EXTENSION_API_ONLY: "YES",
          CLANG_ANALYZER_NONNULL: "YES",
          CODE_SIGN_STYLE: "Automatic",
          CURRENT_PROJECT_VERSION: "1",
          GENERATE_INFOPLIST_FILE: "YES",
          INFOPLIST_FILE: `${WIDGET_TARGET_NAME}/Info.plist`,
          INFOPLIST_KEY_CFBundleDisplayName: WIDGET_TARGET_NAME,
          INFOPLIST_KEY_NSExtension: `{
            NSExtensionPointIdentifier = "com.apple.widgetkit-extension";
          }`,
          LD_RUNPATH_SEARCH_PATHS: [
            '"$(inherited)"',
            '"@executable_path/Frameworks"',
            '"@executable_path/../../Frameworks"',
          ],
          MARKETING_VERSION: "1.0",
          PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
          PRODUCT_NAME: "$(TARGET_NAME)",
          SKIP_INSTALL: "YES",
          SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
          SWIFT_EMIT_LOC_STRINGS: "YES",
          SWIFT_VERSION: "5.0",
          TARGETED_DEVICE_FAMILY: '"1,2"',
        },
        name: "Debug",
      };

      xcodeProject.pbxXCBuildConfigurationSection()[releaseBuildUUID] = {
        isa: "XCBuildConfiguration",
        buildSettings: {
          ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES: "NO",
          APPLICATION_EXTENSION_API_ONLY: "YES",
          CLANG_ANALYZER_NONNULL: "YES",
          CODE_SIGN_STYLE: "Automatic",
          CURRENT_PROJECT_VERSION: "1",
          GENERATE_INFOPLIST_FILE: "YES",
          INFOPLIST_FILE: `${WIDGET_TARGET_NAME}/Info.plist`,
          INFOPLIST_KEY_CFBundleDisplayName: WIDGET_TARGET_NAME,
          LD_RUNPATH_SEARCH_PATHS: [
            '"$(inherited)"',
            '"@executable_path/Frameworks"',
            '"@executable_path/../../Frameworks"',
          ],
          MARKETING_VERSION: "1.0",
          PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
          PRODUCT_NAME: "$(TARGET_NAME)",
          SKIP_INSTALL: "YES",
          SWIFT_EMIT_LOC_STRINGS: "YES",
          SWIFT_VERSION: "5.0",
          TARGETED_DEVICE_FAMILY: '"1,2"',
        },
        name: "Release",
      };

      xcodeProject.pbxXCConfigurationListSection()[buildConfigListUUID] = {
        isa: "XCConfigurationList",
        buildConfigurations: [
          { value: debugBuildUUID, comment: "Debug" },
          { value: releaseBuildUUID, comment: "Release" },
        ],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
      };

      // Sources build phase
      xcodeProject.pbxSourcesBuildPhaseSection()[sourcesPhaseUUID] = {
        isa: "PBXSourcesBuildPhase",
        buildActionMask: 2147483647,
        files: [],
        runOnlyForDeploymentPostprocessing: 0,
      };

      // Resources build phase
      xcodeProject.pbxResourcesBuildPhaseSection()[resourcesPhaseUUID] = {
        isa: "PBXResourcesBuildPhase",
        buildActionMask: 2147483647,
        files: [],
        runOnlyForDeploymentPostprocessing: 0,
      };

      // Native target
      xcodeProject.pbxNativeTargetSection()[widgetUUID] = {
        isa: "PBXNativeTarget",
        buildConfigurationList: buildConfigListUUID,
        buildPhases: [
          { value: sourcesPhaseUUID, comment: "Sources" },
          { value: resourcesPhaseUUID, comment: "Resources" },
        ],
        buildRules: [],
        dependencies: [],
        name: WIDGET_TARGET_NAME,
        productName: WIDGET_TARGET_NAME,
        productReference: xcodeProject.generateUuid(),
        productType: '"com.apple.product-type.app-extension"',
      };
    } catch (e) {
      console.warn("[withFokusWidget] Could not add Xcode target:", e.message);
    }

    return mod;
  });
}

/**
 * Step 4: Add native module for widget data bridge
 */
function withWidgetBridgeNativeModule(config) {
  return withDangerousMod(config, [
    "ios",
    (mod) => {
      const iosDir = mod.modRequest.platformProjectRoot;
      const projectName = mod.modRequest.projectName ?? "FokusApp";
      const moduleDir = path.join(iosDir, projectName);

      const bridgeH = `
#import <React/RCTBridgeModule.h>

@interface FokusWidgetBridge : NSObject <RCTBridgeModule>
@end
`.trim();

      const bridgeM = `
#import "FokusWidgetBridge.h"
#import <WidgetKit/WidgetKit.h>

@implementation FokusWidgetBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(updateData:(NSString *)jsonData)
{
  NSString *appGroupId = @"group.${
    config.ios?.bundleIdentifier ?? "com.replit.fokus"
  }";
  NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:appGroupId];
  [sharedDefaults setObject:jsonData forKey:@"fokusData"];
  [sharedDefaults synchronize];
  
  if (@available(iOS 14.0, *)) {
    [WidgetCenter.shared reloadAllTimelinesWithCompletion:nil];
  }
}

@end
`.trim();

      if (fs.existsSync(moduleDir)) {
        fs.writeFileSync(
          path.join(moduleDir, "FokusWidgetBridge.h"),
          bridgeH
        );
        fs.writeFileSync(
          path.join(moduleDir, "FokusWidgetBridge.m"),
          bridgeM
        );
      }

      return mod;
    },
  ]);
}

/**
 * Compose all modifications
 */
function withFokusWidget(config) {
  config = withAppGroupEntitlement(config);
  config = withWidgetSourceFiles(config);
  config = withWidgetXcodeTarget(config);
  config = withWidgetBridgeNativeModule(config);
  return config;
}

module.exports = withFokusWidget;
