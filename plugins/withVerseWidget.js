const { withEntitlementsPlist, withAndroidManifest, withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_TARGET_NAME = 'VerseWidgetExtension';
const WIDGET_BUNDLE_ID = 'com.biblenotes.app.VerseWidget';
const APP_GROUP = 'group.com.biblenotes.app';

const withVerseWidget = (config) => {
  // 1. Configure iOS App Group Entitlements for shared WidgetKit storage
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      APP_GROUP,
    ];
    return config;
  });

  // 2. Configure iOS Xcode Project — add WidgetKit extension target with proper embedding
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Bail out if the target already exists (re-run safety)
    if (xcodeProject.pbxTargetByName(WIDGET_TARGET_NAME)) {
      return config;
    }

    try {
      // --- Create the widget extension target ---
      const target = xcodeProject.addTarget(
        WIDGET_TARGET_NAME,
        'app_extension',
        WIDGET_TARGET_NAME,
        WIDGET_BUNDLE_ID
      );

      if (!target || !target.uuid) {
        console.warn('withVerseWidget: Failed to create widget target');
        return config;
      }

      // --- Add source file build phase ---
      xcodeProject.addBuildPhase(
        [`${WIDGET_TARGET_NAME}/VerseWidget.swift`],
        'PBXSourcesBuildPhase',
        'Sources',
        target.uuid
      );

      // --- Add WidgetKit and SwiftUI frameworks to the widget target ---
      xcodeProject.addFramework('WidgetKit.framework', {
        target: target.uuid,
        link: true,
      });
      xcodeProject.addFramework('SwiftUI.framework', {
        target: target.uuid,
        link: true,
      });

      // --- Configure build settings for the widget extension target ---
      const configList = xcodeProject.pbxXCConfigurationList();
      const targetConfigList = configList[target.pbxNativeTarget.buildConfigurationList];

      if (targetConfigList && targetConfigList.buildConfigurations) {
        for (const configRef of targetConfigList.buildConfigurations) {
          const buildSettings = xcodeProject.pbxXCBuildConfigurationSection()[
            configRef.value
          ].buildSettings;

          buildSettings.PRODUCT_NAME = `"${WIDGET_TARGET_NAME}"`;
          buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${WIDGET_BUNDLE_ID}"`;
          buildSettings.INFOPLIST_FILE = `"${WIDGET_TARGET_NAME}/Info.plist"`;
          buildSettings.SWIFT_VERSION = '5.0';
          buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '17.0';
          buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
          buildSettings.CODE_SIGN_STYLE = 'Automatic';
          buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
          buildSettings.SKIP_INSTALL = 'YES';
          buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'NO';
          buildSettings.CODE_SIGN_ENTITLEMENTS = `"${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements"`;
          buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
          // Ensure the extension links to the correct application for its container
          buildSettings.ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME = '"WidgetBackground"';
        }
      }

      // --- Add "Embed App Extensions" Copy Files build phase to the MAIN APP target ---
      // This embeds the .appex bundle into PlugIns/ inside the .app
      const mainTarget = xcodeProject.getFirstTarget();
      if (mainTarget && mainTarget.firstTarget) {
        const mainTargetUuid = mainTarget.firstTarget.uuid;

        // Create an EMPTY copy files phase first (passing files to addBuildPhase
        // would create orphaned PBXFileReference entries that break CocoaPods)
        const embedPhase = xcodeProject.addBuildPhase(
          [],
          'PBXCopyFilesBuildPhase',
          'Embed App Extensions',
          mainTargetUuid,
          'app_extension'
        );

        // Wire the widget's product (.appex) into the embed phase using the
        // EXISTING product reference that addTarget already placed in the Products group
        if (embedPhase) {
          const widgetProductRef = target.pbxNativeTarget.productReference;
          const buildFileUuid = xcodeProject.generateUuid();

          // Register a PBXBuildFile pointing to the existing product reference
          xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
            isa: 'PBXBuildFile',
            fileRef: widgetProductRef,
            fileRef_comment: `${WIDGET_TARGET_NAME}.appex`,
            settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
          };
          xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] =
            `${WIDGET_TARGET_NAME}.appex in Embed App Extensions`;

          // Add the build file to the embed phase's files list
          const copySection = xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'];
          if (copySection && copySection[embedPhase.uuid]) {
            copySection[embedPhase.uuid].files.push({
              value: buildFileUuid,
              comment: `${WIDGET_TARGET_NAME}.appex in Embed App Extensions`,
            });
          }
        }

        // Add target dependency — main app depends on widget target
        xcodeProject.addTargetDependency(mainTargetUuid, [target.uuid]);
      }
    } catch (err) {
      console.warn('withVerseWidget: Error while configuring Xcode widget target:', err);
    }

    return config;
  });

  // 3. Configure Android AppWidget Provider in AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const hasReceiver = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.VerseWidgetProvider'
    );

    if (!hasReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.VerseWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/verse_widget_info',
            },
          },
        ],
      });
    }

    return config;
  });

  // 4. Copy Android Widget Native Files & Audio Assets
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const widgetSrcDir = path.join(projectRoot, 'widgets', 'android');

      const javaDir = path.join(platformRoot, 'app', 'src', 'main', 'java', 'com', 'biblenotes', 'app');
      const layoutDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'layout');
      const xmlDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'xml');
      const drawableDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'drawable');
      const rawDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'raw');

      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(layoutDir, { recursive: true });
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.mkdirSync(rawDir, { recursive: true });

      const ktSrc = path.join(widgetSrcDir, 'VerseWidgetProvider.kt');
      if (fs.existsSync(ktSrc)) {
        fs.copyFileSync(ktSrc, path.join(javaDir, 'VerseWidgetProvider.kt'));
      }

      const layoutSrc = path.join(widgetSrcDir, 'verse_widget_layout.xml');
      if (fs.existsSync(layoutSrc)) {
        fs.copyFileSync(layoutSrc, path.join(layoutDir, 'verse_widget_layout.xml'));
      }

      const infoSrc = path.join(widgetSrcDir, 'verse_widget_info.xml');
      if (fs.existsSync(infoSrc)) {
        fs.copyFileSync(infoSrc, path.join(xmlDir, 'verse_widget_info.xml'));
      }

      const drawableSrc = path.join(widgetSrcDir, 'widget_glass_bg.xml');
      if (fs.existsSync(drawableSrc)) {
        fs.copyFileSync(drawableSrc, path.join(drawableDir, 'widget_glass_bg.xml'));
      }

      const assetsDir = path.join(projectRoot, 'assets');
      if (fs.existsSync(assetsDir)) {
        const soundFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.wav'));
        for (const sf of soundFiles) {
          fs.copyFileSync(path.join(assetsDir, sf), path.join(rawDir, sf));
        }
      }

      return config;
    },
  ]);

  // 5. Copy iOS WidgetKit Native Files (Swift, Info.plist) + Generate Entitlements
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const widgetSrcDir = path.join(projectRoot, 'widgets', 'ios');
      const iosWidgetDir = path.join(platformRoot, WIDGET_TARGET_NAME);

      fs.mkdirSync(iosWidgetDir, { recursive: true });

      // Copy Swift source file
      const swiftSrc = path.join(widgetSrcDir, 'VerseWidget.swift');
      if (fs.existsSync(swiftSrc)) {
        fs.copyFileSync(swiftSrc, path.join(iosWidgetDir, 'VerseWidget.swift'));
      }

      // Copy Info.plist
      const plistSrc = path.join(widgetSrcDir, 'Info.plist');
      if (fs.existsSync(plistSrc)) {
        fs.copyFileSync(plistSrc, path.join(iosWidgetDir, 'Info.plist'));
      }

      // Generate widget extension entitlements file with App Group
      const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>
`;
      fs.writeFileSync(
        path.join(iosWidgetDir, `${WIDGET_TARGET_NAME}.entitlements`),
        entitlementsContent
      );

      return config;
    },
  ]);

  return config;
};

module.exports = withVerseWidget;
