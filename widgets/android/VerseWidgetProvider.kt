package com.biblenotes.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import com.biblenotes.app.R

class VerseWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences("BibleNoteWidgetPrefs", Context.MODE_PRIVATE)
            val citation = prefs.getString("widget_verse_citation", "John 3:16") ?: "John 3:16"
            val text = prefs.getString(
                "widget_verse_text",
                "For God so loved the world, that he gave his only begotten Son..."
            ) ?: "For God so loved the world..."

            val views = RemoteViews(context.packageName, R.layout.verse_widget_layout)
            views.setTextViewText(R.id.widget_verse_citation, "— $citation")
            views.setTextViewText(R.id.widget_verse_text, "\"$text\"")

            // Tap widget to launch app
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("biblenotes://bible"))
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
