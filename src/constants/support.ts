import { Linking } from 'react-native';

/**
 * Support & Donation Configuration for Shepherd.
 */
export const SUPPORT_CONFIG = {
  // Official Shepherd Facebook Page URL
  facebookPageUrl: 'https://www.facebook.com/share/14trCWWT33L/?mibextid=wwXIfr',

  // Official Shepherd Messenger conversation URL
  messengerUrl: 'https://m.me/christian.mestola.7',

  // Developer contact
  developerFacebookUrl: 'https://www.facebook.com/share/14trCWWT33L/?mibextid=wwXIfr',
  developerMessengerUrl: 'https://m.me/christian.mestola.7',
};

/**
 * Open Messenger directly.
 * Tries native Messenger deep-link first, falls back to web Messenger or Facebook page.
 */
export async function openShepherdMessenger(url: string = SUPPORT_CONFIG.messengerUrl): Promise<void> {
  const messengerAppUrl = 'fb-messenger://user-thread/christian.mestola.7';
  try {
    const canOpenApp = await Linking.canOpenURL(messengerAppUrl);
    if (canOpenApp) {
      await Linking.openURL(messengerAppUrl);
      return;
    }
  } catch {
    // Continue to web Messenger URL
  }

  try {
    const canOpenMessenger = await Linking.canOpenURL(url);
    if (canOpenMessenger) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // Continue to fallback
  }

  try {
    await Linking.openURL(SUPPORT_CONFIG.facebookPageUrl);
  } catch (err) {
    console.warn('Unable to open Messenger or Facebook link:', err);
  }
}

/**
 * Open official Shepherd Facebook Page.
 */
export async function openShepherdFacebookPage(url: string = SUPPORT_CONFIG.facebookPageUrl): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await openShepherdMessenger();
    }
  } catch (err) {
    console.warn('Unable to open Facebook Page URL:', err);
    await openShepherdMessenger();
  }
}
