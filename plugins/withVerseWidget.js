const { withEntitlementsPlist, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
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

  // 2. Configure Android AppWidget Provider
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

  // 3. Copy Android Widget Native Files (Kotlin, Layout XML, Info XML)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const widgetSrcDir = path.join(projectRoot, 'widgets', 'android');

      // Target directories
      const javaDir = path.join(platformRoot, 'app', 'src', 'main', 'java', 'com', 'biblenotes', 'app');
      const layoutDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'layout');
      const xmlDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'xml');
      const drawableDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'drawable');

      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(layoutDir, { recursive: true });
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.mkdirSync(drawableDir, { recursive: true });

      // Copy files
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

      return config;
    },
  ]);

  return config;
};

module.exports = withVerseWidget;
