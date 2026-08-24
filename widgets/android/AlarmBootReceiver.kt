package com.biblenotes.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BroadcastReceiver that fires after device reboot (BOOT_COMPLETED).
 *
 * Android wipes ALL AlarmManager-based alarms on reboot. expo-notifications
 * schedules alarms via AlarmManager, so they are all lost after a restart.
 *
 * This receiver launches the main activity in the background so that
 * React Native boots up and the alarm service re-schedules all notifications.
 *
 * Required manifest entries:
 *   <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
 *   <receiver android:name=".AlarmBootReceiver" ...>
 */
class AlarmBootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "AlarmBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON" ||
            intent.action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            Log.d(TAG, "Device boot detected — launching app to re-register alarm notifications")

            try {
                // Launch the main activity so the React Native JS bundle boots
                // and AlarmService.rescheduleAllAlarms() runs in _layout.tsx's AppState listener.
                // FLAG_ACTIVITY_NEW_TASK is required when starting from a BroadcastReceiver.
                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    // Don't bring app to foreground — just let it initialise in background
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                    context.startActivity(launchIntent)
                    Log.d(TAG, "Successfully launched app to reschedule alarms after boot")
                } else {
                    Log.w(TAG, "Could not get launch intent for package: ${context.packageName}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error launching app after boot: ${e.message}", e)
            }
        }
    }
}
