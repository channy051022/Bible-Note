const { withEntitlementsPlist, withAndroidManifest } = require('@expo/config-plugins');

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

  return config;
};

module.exports = withVerseWidget;
