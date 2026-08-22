#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>

@interface WidgetBridge : NSObject <RCTBridgeModule>
@end

@implementation WidgetBridge

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

RCT_EXPORT_METHOD(setWidgetData:(NSString *)citation
                  text:(NSString *)text
                  version:(NSString *)version
                  theme:(NSString *)theme
                  bookId:(nonnull NSNumber *)bookId
                  chapter:(nonnull NSNumber *)chapter
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.biblenotes.app"];
    if (defaults) {
        [defaults setObject:citation forKey:@"widget_verse_citation"];
        [defaults setObject:text forKey:@"widget_verse_text"];
        [defaults setObject:version forKey:@"widget_verse_version"];
        [defaults setObject:theme forKey:@"widget_theme"];
        [defaults setObject:bookId forKey:@"widget_verse_book_id"];
        [defaults setObject:chapter forKey:@"widget_verse_chapter"];
        [defaults synchronize];

        resolve(@(YES));
    } else {
        reject(@"E_APP_GROUP", @"Could not open UserDefaults for app group group.com.biblenotes.app", nil);
    }
}

@end
