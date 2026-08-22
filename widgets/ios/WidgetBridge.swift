import Foundation
import WidgetKit

@objc(WidgetBridge)
class WidgetBridge: NSObject {
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    func setWidgetData(_ citation: String, text: String, version: String, theme: String, bookId: Int, chapter: Int, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let defaults = UserDefaults(suiteName: "group.com.biblenotes.app") {
            defaults.set(citation, forKey: "widget_verse_citation")
            defaults.set(text, forKey: "widget_verse_text")
            defaults.set(version, forKey: "widget_verse_version")
            defaults.set(theme, forKey: "widget_theme")
            defaults.set(bookId, forKey: "widget_verse_book_id")
            defaults.set(chapter, forKey: "widget_verse_chapter")
            defaults.synchronize()

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            resolve(true)
        } else {
            reject("E_APP_GROUP", "Could not open UserDefaults for app group group.com.biblenotes.app", nil)
        }
    }
}
