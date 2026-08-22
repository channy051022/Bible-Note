import WidgetKit
import SwiftUI

// Data structure for the Verse of the Day Widget
struct VerseWidgetEntry: TimelineEntry {
    let date: Date
    let citation: String
    let text: String
    let version: String
    let bookId: Int
    let chapter: Int
}

// Timeline Provider that fetches verse data from shared UserDefaults (App Group)
struct VerseTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> VerseWidgetEntry {
        VerseWidgetEntry(
            date: Date(),
            citation: "John 3:16",
            text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
            version: "KJV",
            bookId: 43,
            chapter: 3
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (VerseWidgetEntry) -> ()) {
        let entry = loadVerseFromSharedStorage()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VerseWidgetEntry>) -> ()) {
        let entry = loadVerseFromSharedStorage()
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 4, to: Date()) ?? Date().addingTimeInterval(14400)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadVerseFromSharedStorage() -> VerseWidgetEntry {
        let defaults = UserDefaults(suiteName: "group.com.biblenotes.app")
        let citation = defaults?.string(forKey: "widget_verse_citation") ?? "John 3:16"
        let text = defaults?.string(forKey: "widget_verse_text") ?? "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
        let version = defaults?.string(forKey: "widget_verse_version") ?? "KJV"
        let bookId = defaults?.integer(forKey: "widget_verse_book_id") ?? 43
        let chapter = defaults?.integer(forKey: "widget_verse_chapter") ?? 3

        return VerseWidgetEntry(
            date: Date(),
            citation: citation,
            text: text,
            version: version,
            bookId: bookId,
            chapter: chapter
        )
    }
}

// Accent color used for headers and citation
private let accentBlue = Color(red: 0.38, green: 0.65, blue: 0.98)

// SwiftUI content view for the widget
struct VerseWidgetEntryView: View {
    var entry: VerseTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header Badge
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(accentBlue)
                    Text("VERSE OF THE DAY")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(accentBlue)
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(Color.white.opacity(0.1))
                .cornerRadius(6)

                Spacer()

                Text(entry.version)
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white.opacity(0.6))
            }

            // Verse Body
            Text("\"\(entry.text)\"")
                .font(.system(size: family == .systemSmall ? 11 : 13, weight: .medium, design: .serif))
                .italic()
                .foregroundColor(.white.opacity(0.92))
                .lineLimit(family == .systemSmall ? 3 : family == .systemMedium ? 3 : 7)
                .lineSpacing(2)

            Spacer(minLength: 0)

            // Citation footer
            HStack {
                Spacer()
                Text("— \(entry.citation)")
                    .font(.system(size: family == .systemSmall ? 10 : 12, weight: .bold))
                    .foregroundColor(accentBlue)
            }
        }
        .padding(12)
        .widgetURL(URL(string: "biblenotes://bible?bookId=\(entry.bookId)&chapter=\(entry.chapter)"))
    }
}

// Widget Configuration Entry point
@main
struct VerseWidget: Widget {
    let kind: String = "SHEPHERD_VerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VerseTimelineProvider()) { entry in
            VerseWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    // Dark glass-style gradient background (fully opaque)
                    ZStack {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.10, green: 0.12, blue: 0.18),
                                Color(red: 0.05, green: 0.06, blue: 0.10)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        // Subtle glass highlight shimmer at top edge
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.white.opacity(0.08),
                                Color.clear
                            ]),
                            startPoint: .top,
                            endPoint: .center
                        )
                    }
                }
        }
        .configurationDisplayName("SHEPHERD Verse of the Day")
        .description("Daily uplifting Scripture on your Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
