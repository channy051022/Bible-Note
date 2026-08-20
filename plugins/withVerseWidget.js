const { withEntitlementsPlist, withAndroidManifest, withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withVerseWidget = (config) => {
  // 1. Configure iOS App Group Entitlements for shared WidgetKit storage
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.biblenotes.app',
    ];
    return config;
  });

  // 2. Configure iOS Xcode Target for WidgetKit Extension
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const targetName = 'VerseWidget';
    const bundleId = 'com.biblenotes.app.VerseWidget';

    if (!xcodeProject.pbxTargetByName(targetName)) {
      try {
        const target = xcodeProject.addTarget(
          targetName,
          'app_extension',
          targetName,
          bundleId
        );

        if (target && target.uuid) {
          xcodeProject.addBuildPhase(
            ['VerseWidget/VerseWidget.swift'],
            'PBXSourcesBuildPhase',
            'Sources',
            target.uuid
          );

          xcodeProject.addFramework('WidgetKit.framework', { target: target.uuid });
          xcodeProject.addFramework('SwiftUI.framework', { target: target.uuid });

          const configurations = xcodeProject.pbxXCConfigurationList()[
            target.pbxNativeTarget.buildConfigurationList
          ];

          if (configurations && configurations.buildConfigurations) {
            for (const configRef of configurations.buildConfigurations) {
              const buildSettings = xcodeProject.pbxXCBuildConfigurationSection()[
                configRef.value
              ].buildSettings;

              buildSettings.PRODUCT_NAME = `"${targetName}"`;
              buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleId}"`;
              buildSettings.INFOPLIST_FILE = `"VerseWidget/Info.plist"`;
              buildSettings.SWIFT_VERSION = '5.0';
              buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '15.0';
              buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
              buildSettings.CODE_SIGN_STYLE = 'Automatic';
              buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
            }
          }
        }
      } catch (err) {
        console.warn('withVerseWidget: Warning while adding Xcode widget target:', err);
      }
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

  // 5. Copy iOS WidgetKit Native Files (Swift, Info.plist)
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const widgetSrcDir = path.join(projectRoot, 'widgets', 'ios');
      const iosWidgetDir = path.join(platformRoot, 'VerseWidget');

      fs.mkdirSync(iosWidgetDir, { recursive: true });

      const swiftSrc = path.join(widgetSrcDir, 'VerseWidget.swift');
      if (fs.existsSync(swiftSrc)) {
        fs.copyFileSync(swiftSrc, path.join(iosWidgetDir, 'VerseWidget.swift'));
      }

      const plistSrc = path.join(widgetSrcDir, 'Info.plist');
      if (fs.existsSync(plistSrc)) {
        fs.copyFileSync(plistSrc, path.join(iosWidgetDir, 'Info.plist'));
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withVerseWidget;
