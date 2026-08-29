package com.biblenotes.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color

import android.net.Uri
import android.widget.RemoteViews

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
        /**
         * Returns theme colors as [bgColor, borderColor, textColor, accentColor, badgeTextColor]
         * based on the widget_theme preference.
         */
        private fun getThemeColors(theme: String): IntArray {
            return when (theme) {
                "gold" -> intArrayOf(
                    Color.parseColor("#F0241904"),  // bg (with alpha)
                    Color.parseColor("#D99B26"),     // border
                    Color.parseColor("#FFF4D6"),     // text
                    Color.parseColor("#FFD700"),     // accent
                    Color.parseColor("#FFD700")      // badge text
                )
                "midnight" -> intArrayOf(
                    Color.parseColor("#F0080E21"),
                    Color.parseColor("#1E3A8A"),
                    Color.parseColor("#E0E7FF"),
                    Color.parseColor("#818CF8"),
                    Color.parseColor("#818CF8")
                )
                "emerald" -> intArrayOf(
                    Color.parseColor("#F0051E14"),
                    Color.parseColor("#059669"),
                    Color.parseColor("#D1FAE5"),
                    Color.parseColor("#34D399"),
                    Color.parseColor("#34D399")
                )
                "pure_glass" -> intArrayOf(
                    Color.parseColor("#30FFFFFF"),
                    Color.parseColor("#48FFFFFF"),
                    Color.parseColor("#F2FFFFFF"),
                    Color.parseColor("#60A5FA"),
                    Color.parseColor("#60A5FA")
                )
                else -> intArrayOf( // "glass" default
                    Color.parseColor("#CC121722"),
                    Color.parseColor("#33FFFFFF"),
                    Color.parseColor("#EAFFFFFF"),
                    Color.parseColor("#60A5FA"),
                    Color.parseColor("#60A5FA")
                )
            }
        }

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
            val theme = prefs.getString("widget_theme", "glass") ?: "glass"

            val colors = getThemeColors(theme)
            val bgColor = colors[0]
            val borderColor = colors[1]
            val textColor = colors[2]
            val accentColor = colors[3]
            val badgeColor = colors[4]

            val views = RemoteViews(context.packageName, R.layout.verse_widget_layout)

            // Dynamically tint the rounded-corner drawable background to match the theme
            // backgroundTintList preserves the shape/corners from widget_glass_bg.xml
            views.setColorStateList(R.id.widget_container, "setBackgroundTintList", ColorStateList.valueOf(bgColor))

            // Set text colors based on theme
            views.setTextViewText(R.id.widget_verse_citation, "— $citation")
            views.setTextViewText(R.id.widget_verse_text, "\"$text\"")
            views.setTextColor(R.id.widget_verse_text, textColor)
            views.setTextColor(R.id.widget_verse_citation, accentColor)
            views.setTextColor(R.id.widget_badge, badgeColor)

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
