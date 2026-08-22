#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)

RCT_EXTERN_METHOD(setWidgetData:(NSString *)citation
                  text:(NSString *)text
                  version:(NSString *)version
                  theme:(NSString *)theme
                  bookId:(NSInteger)bookId
                  chapter:(NSInteger)chapter
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
