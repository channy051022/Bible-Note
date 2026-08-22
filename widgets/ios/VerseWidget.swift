import WidgetKit
import SwiftUI

// Data structure for the Verse of the Day Widget
struct VerseWidgetEntry: TimelineEntry {
    let date: Date
    let citation: String
    let text: String
    let version: String
    let theme: String
    let bookId: Int
    let chapter: Int
}

struct DailyVerseItem {
    let citation: String
    let text: String
    let bookId: Int
    let chapter: Int
}

// 37 Curated Daily Verses matching VerseOfTheDay.ts exactly
private let dailyVersesList: [DailyVerseItem] = [
    DailyVerseItem(citation: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", bookId: 43, chapter: 3),
    DailyVerseItem(citation: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me.", bookId: 50, chapter: 4),
    DailyVerseItem(citation: "Psalms 23:1", text: "The Lord is my shepherd; I shall not want.", bookId: 19, chapter: 23),
    DailyVerseItem(citation: "Proverbs 3:5", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.", bookId: 20, chapter: 3),
    DailyVerseItem(citation: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", bookId: 45, chapter: 8),
    DailyVerseItem(citation: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.", bookId: 24, chapter: 29),
    DailyVerseItem(citation: "Isaiah 40:31", text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", bookId: 23, chapter: 40),
    DailyVerseItem(citation: "Matthew 6:33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", bookId: 40, chapter: 6),
    DailyVerseItem(citation: "Romans 12:2", text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.", bookId: 45, chapter: 12),
    DailyVerseItem(citation: "Galatians 5:22", text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,", bookId: 48, chapter: 5),
    DailyVerseItem(citation: "Philippians 4:6", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", bookId: 50, chapter: 4),
    DailyVerseItem(citation: "Ephesians 2:8", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:", bookId: 49, chapter: 2),
    DailyVerseItem(citation: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.", bookId: 6, chapter: 1),
    DailyVerseItem(citation: "Psalms 46:1", text: "God is our refuge and strength, a very present help in trouble.", bookId: 19, chapter: 46),
    DailyVerseItem(citation: "Psalms 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", bookId: 19, chapter: 119),
    DailyVerseItem(citation: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", bookId: 40, chapter: 11),
    DailyVerseItem(citation: "John 14:6", text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.", bookId: 43, chapter: 14),
    DailyVerseItem(citation: "2 Corinthians 5:17", text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.", bookId: 47, chapter: 5),
    DailyVerseItem(citation: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", bookId: 55, chapter: 1),
    DailyVerseItem(citation: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen.", bookId: 58, chapter: 11),
    DailyVerseItem(citation: "James 1:2", text: "My brethren, count it all joy when ye fall into divers temptations;", bookId: 59, chapter: 1),
    DailyVerseItem(citation: "1 Peter 5:7", text: "Casting all your care upon him; for he careth for you.", bookId: 60, chapter: 5),
    DailyVerseItem(citation: "1 John 1:9", text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.", bookId: 62, chapter: 1),
    DailyVerseItem(citation: "Psalms 91:1", text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.", bookId: 19, chapter: 91),
    DailyVerseItem(citation: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", bookId: 23, chapter: 41),
    DailyVerseItem(citation: "Proverbs 18:10", text: "The name of the Lord is a strong tower: the righteous runneth into it, and is safe.", bookId: 20, chapter: 18),
    DailyVerseItem(citation: "Matthew 28:19", text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:", bookId: 40, chapter: 28),
    DailyVerseItem(citation: "John 10:10", text: "The thief cometh not, but for to steal, and to kill, and to destroy: I am come that they might have life, and that they might have it more abundantly.", bookId: 43, chapter: 10),
    DailyVerseItem(citation: "Romans 5:8", text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.", bookId: 45, chapter: 5),
    DailyVerseItem(citation: "1 Corinthians 13:13", text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.", bookId: 46, chapter: 13),
    DailyVerseItem(citation: "Galatians 2:20", text: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.", bookId: 48, chapter: 2),
    DailyVerseItem(citation: "Ephesians 6:11", text: "Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.", bookId: 49, chapter: 6),
    DailyVerseItem(citation: "Philippians 1:6", text: "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ:", bookId: 50, chapter: 1),
    DailyVerseItem(citation: "Colossians 3:2", text: "Set your affection on things above, not on things on the earth.", bookId: 51, chapter: 3),
    DailyVerseItem(citation: "1 Thessalonians 5:16", text: "Rejoice evermore.", bookId: 52, chapter: 5),
    DailyVerseItem(citation: "Hebrews 4:12", text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.", bookId: 58, chapter: 4),
    DailyVerseItem(citation: "Revelation 21:4", text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.", bookId: 66, chapter: 21)
]

// Timeline Provider that fetches verse data from shared UserDefaults (App Group) with automatic daily rotation
struct VerseTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> VerseWidgetEntry {
        let item = dailyVersesList[0]
        return VerseWidgetEntry(
            date: Date(),
            citation: item.citation,
            text: item.text,
            version: "KJV",
            theme: "glass",
            bookId: item.bookId,
            chapter: item.chapter
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (VerseWidgetEntry) -> ()) {
        let entry = loadVerseFromSharedStorage()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VerseWidgetEntry>) -> ()) {
        let entry = loadVerseFromSharedStorage()
        // Refresh at midnight or after 4 hours
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 4, to: Date()) ?? Date().addingTimeInterval(14400)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadVerseFromSharedStorage() -> VerseWidgetEntry {
        let defaults = UserDefaults(suiteName: "group.com.biblenotes.app")
        let theme = defaults?.string(forKey: "widget_theme") ?? "glass"

        let storedCitation = defaults?.string(forKey: "widget_verse_citation")
        let storedText = defaults?.string(forKey: "widget_verse_text")

        // If custom verse or bookmark was explicitly synced from app
        if let citation = storedCitation, !citation.isEmpty,
           let text = storedText, !text.isEmpty {
            let version = defaults?.string(forKey: "widget_verse_version") ?? "KJV"
            let bookId = defaults?.integer(forKey: "widget_verse_book_id") ?? 43
            let chapter = defaults?.integer(forKey: "widget_verse_chapter") ?? 3
            return VerseWidgetEntry(
                date: Date(),
                citation: citation,
                text: text,
                version: version,
                theme: theme,
                bookId: bookId,
                chapter: chapter
            )
        }

        // Automatic daily calculation matching app's Verse of the Day algorithm!
        let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let index = abs(dayOfYear) % dailyVersesList.count
        let item = dailyVersesList[max(0, min(dailyVersesList.count - 1, index))]

        return VerseWidgetEntry(
            date: Date(),
            citation: item.citation,
            text: item.text,
            version: "KJV",
            theme: theme,
            bookId: item.bookId,
            chapter: item.chapter
        )
    }
}

// Widget Color Theme Config
struct WidgetThemeColors {
    let accent: Color
    let bgTop: Color
    let bgBottom: Color
    let badgeBg: Color
    let textPrimary: Color
    let textSecondary: Color

    static func forTheme(_ theme: String) -> WidgetThemeColors {
        switch theme {
        case "gold":
            return WidgetThemeColors(
                accent: Color(red: 1.0, green: 0.84, blue: 0.0),
                bgTop: Color(red: 0.18, green: 0.12, blue: 0.03),
                bgBottom: Color(red: 0.08, green: 0.05, blue: 0.01),
                badgeBg: Color(red: 1.0, green: 0.84, blue: 0.0).opacity(0.18),
                textPrimary: Color(red: 1.0, green: 0.96, blue: 0.84),
                textSecondary: Color(red: 0.90, green: 0.75, blue: 0.35)
            )
        case "midnight":
            return WidgetThemeColors(
                accent: Color(red: 0.51, green: 0.55, blue: 0.98),
                bgTop: Color(red: 0.05, green: 0.08, blue: 0.20),
                bgBottom: Color(red: 0.02, green: 0.03, blue: 0.08),
                badgeBg: Color(red: 0.51, green: 0.55, blue: 0.98).opacity(0.18),
                textPrimary: Color(red: 0.88, green: 0.91, blue: 1.0),
                textSecondary: Color(red: 0.65, green: 0.72, blue: 0.95)
            )
        case "emerald":
            return WidgetThemeColors(
                accent: Color(red: 0.20, green: 0.83, blue: 0.60),
                bgTop: Color(red: 0.03, green: 0.15, blue: 0.10),
                bgBottom: Color(red: 0.01, green: 0.06, blue: 0.04),
                badgeBg: Color(red: 0.20, green: 0.83, blue: 0.60).opacity(0.18),
                textPrimary: Color(red: 0.82, green: 0.98, blue: 0.90),
                textSecondary: Color(red: 0.40, green: 0.80, blue: 0.65)
            )
        case "pure_glass":
            return WidgetThemeColors(
                accent: Color(red: 0.38, green: 0.65, blue: 0.98),
                bgTop: Color(red: 0.15, green: 0.20, blue: 0.30),
                bgBottom: Color(red: 0.08, green: 0.12, blue: 0.20),
                badgeBg: Color.white.opacity(0.15),
                textPrimary: Color.white.opacity(0.95),
                textSecondary: Color(red: 0.38, green: 0.65, blue: 0.98)
            )
        default:
            return WidgetThemeColors(
                accent: Color(red: 0.38, green: 0.65, blue: 0.98),
                bgTop: Color(red: 0.10, green: 0.12, blue: 0.18),
                bgBottom: Color(red: 0.05, green: 0.06, blue: 0.10),
                badgeBg: Color.white.opacity(0.10),
                textPrimary: Color.white.opacity(0.92),
                textSecondary: Color(red: 0.38, green: 0.65, blue: 0.98)
            )
        }
    }
}

// SwiftUI content view for the widget
struct VerseWidgetEntryView: View {
    var entry: VerseTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        let colors = WidgetThemeColors.forTheme(entry.theme)

        VStack(alignment: .leading, spacing: 6) {
            // Header Badge
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(colors.accent)
                    Text("VERSE OF THE DAY")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(colors.accent)
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(colors.badgeBg)
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
                .foregroundColor(colors.textPrimary)
                .lineLimit(family == .systemSmall ? 3 : family == .systemMedium ? 3 : 7)
                .lineSpacing(2)

            Spacer(minLength: 0)

            // Citation footer
            HStack {
                Spacer()
                Text("— \(entry.citation)")
                    .font(.system(size: family == .systemSmall ? 10 : 12, weight: .bold))
                    .foregroundColor(colors.accent)
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
            let colors = WidgetThemeColors.forTheme(entry.theme)

            VerseWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    ZStack {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                colors.bgTop,
                                colors.bgBottom
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
