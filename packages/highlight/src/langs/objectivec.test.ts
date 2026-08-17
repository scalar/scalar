import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import objectivec from './objectivec'

registerLanguage(objectivec)

const known = new Set(Object.keys(SCOPES))

/**
 * A slice of a real cache class: message sends nested three deep, both comment
 * forms, every numeric literal shape, `@`-literals, preprocessor directives,
 * a selector spelled with colons, and a format string carrying an escape.
 *
 * `String.raw` keeps the Objective-C escapes (`\n`, `\"`) as the two characters
 * the highlighter has to see, rather than as JavaScript escapes.
 */
const code = String.raw`//
//  ImageCache.m
//  Written to exercise the grammar, not to compile.
//

#import <Foundation/Foundation.h>
#import "ImageCache.h"

#define kMaxRetries 3
#pragma mark - Constants

/** Posted once a fetch settles, successfully or not. */
NSString *const ScalarCacheDidUpdateNotification = @"ScalarCacheDidUpdate";

static const NSTimeInterval kTimeout = 12.5;
static const NSUInteger kDefaultCapacity = 0x40;
static const double kEpsilon = 1e-9;
static const char kSeparator = '\n';

typedef NS_ENUM(NSInteger, ScalarCacheState) {
    ScalarCacheStateIdle = 0,
    ScalarCacheStateLoading = 1 << 1,
    ScalarCacheStateFailed = 0b100,
};

@interface ImageCache () <NSURLSessionDelegate>

@property (nonatomic, strong, readonly) NSMutableDictionary<NSString *, UIImage *> *entries;
@property (nonatomic, assign, getter=isSuspended) BOOL suspended;

@end

@implementation ImageCache

+ (instancetype)sharedCache {
    static ImageCache *shared = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shared = [[self alloc] init];
    });
    return shared;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _entries = [NSMutableDictionary dictionaryWithCapacity:kDefaultCapacity];
        _suspended = NO;
    }
    return self;
}

- (nullable UIImage *)imageForKey:(NSString *)key retries:(NSInteger)retries {
    if (key.length == 0 || retries > kMaxRetries) {
        return nil;
    }

    UIImage *cached = self.entries[key];
    if (cached != nil) {
        NSLog(@"cache hit for \"%@\" after %ld tries", key, (long)retries);
        return cached;
    }

    @try {
        NSDictionary *info = @{ @"key": key, @"retries": @(retries), @"eager": @YES };
        [[NSNotificationCenter defaultCenter] postNotificationName:ScalarCacheDidUpdateNotification
                                                            object:self
                                                          userInfo:info];
    } @catch (NSException *exception) {
        [self handleFailure:exception];
    } @finally {
        self.suspended = NO;
    }

    return [self imageForKey:key retries:retries + 1];
}

- (void)handleFailure:(NSException *)exception {
    SEL selector = @selector(imageForKey:retries:);
    if ([self respondsToSelector:selector]) {
        [self performSelector:selector withObject:@"retry" withObject:@0];
    }
}

@end
`

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (source: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(source, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (source: string, lang: string): [string, string][] => {
  return runs(source, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (source: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(source, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

describe('objectivec', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(code, 'objectivec')
        .map((t) => t.text)
        .join(''),
    ).toBe(code)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(code, 'objectivec')) {
      expect(code.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(code, 'objectivec')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `objectivec emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(code, 'objectivec')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(code)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed message send, an unclosed `@"` and a signature with no body
    // are what an editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(code.length / 60))
    for (let end = 0; end <= code.length; end += step) {
      const prefix = code.slice(0, end)
      expect(
        tokenize(prefix, 'objectivec')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates the declaration directives from the control-flow ones', () => {
    assertHas(code, 'objectivec', '@interface', 'keyword.declaration')
    assertHas(code, 'objectivec', '@property', 'keyword.declaration')
    assertHas(code, 'objectivec', '@try', 'keyword.control')
    assertHas(code, 'objectivec', '@finally', 'keyword.control')
  })

  it('names the class being declared, not just its type', () => {
    // `ImageCache` after `@implementation` is a declaration; `UIImage` in a
    // return type is an ordinary framework type.
    assertHas(code, 'objectivec', 'ImageCache', 'class')
    assertHas(code, 'objectivec', 'UIImage', 'type')
  })

  it('keeps the language types apart from the framework classes', () => {
    // `NSInteger` and `BOOL` are typedefs the language ships with; `NSString`
    // is a class and goes through the CapWords rule.
    assertHas(code, 'objectivec', 'NSInteger', 'type.builtin')
    assertHas(code, 'objectivec', 'BOOL', 'type.builtin')
    assertHas(code, 'objectivec', 'instancetype', 'type.builtin')
    assertHas(code, 'objectivec', 'NSString', 'type')
  })

  it('reads a selector as a definition at the declaration and a call in a message', () => {
    // `imageForKey` is declared once and sent twice; the two sites must not
    // collapse into one colour.
    assertHas(code, 'objectivec', 'imageForKey', 'function')
    assertHas(code, 'objectivec', 'imageForKey', 'function.method')
    assertHas(code, 'objectivec', 'retries', 'function')
    assertHas(code, 'objectivec', 'retries', 'variable.parameter')
  })

  it('scopes a no-argument message without claiming a subscript', () => {
    // `[super init]` sends `init`; `self.entries[key]` subscripts with `key`.
    assertHas(code, 'objectivec', 'init', 'function.method')
    assertHas(code, 'objectivec', 'alloc', 'function.method')
    expect(scoped(code, 'objectivec').filter(([t]) => t === 'key')).toEqual([['key', 'variable.parameter']])
  })

  it('distinguishes a C call from a message send', () => {
    assertHas(code, 'objectivec', 'dispatch_once', 'function.call')
    assertHas(code, 'objectivec', 'NSLog', 'function.call')
    assertHas(code, 'objectivec', 'postNotificationName', 'function.method')
  })

  it('treats property attributes as keywords only inside the attribute list', () => {
    assertHas(code, 'objectivec', 'nonatomic', 'keyword')
    assertHas(code, 'objectivec', 'getter', 'keyword')
    assertHas(code, 'objectivec', 'isSuspended', 'function.method')
  })

  it('marks the string prefix, the boxing @ and the format placeholders apart', () => {
    // `@"…"` is an NSString literal, `@(…)`/`@YES` box a value, and `%@` is a
    // placeholder rather than string content.
    assertHas(code, 'objectivec', '@', 'string.special')
    assertHas(code, 'objectivec', '@', 'operator')
    assertHas(code, 'objectivec', '%@', 'string.special')
    assertHas(code, 'objectivec', '%ld', 'string.special')
    assertHas(code, 'objectivec', '\\"', 'string.escape')
  })

  it('keeps a selector literal in one piece', () => {
    assertHas(code, 'objectivec', '@selector', 'keyword.operator')
    assertHas(code, 'objectivec', 'imageForKey:retries:', 'function.method')
  })

  it('reads the preprocessor line and its header path', () => {
    assertHas(code, 'objectivec', '#import', 'keyword.import')
    assertHas(code, 'objectivec', '<Foundation/Foundation.h>', 'string')
    assertHas(code, 'objectivec', '"ImageCache.h"', 'string')
    assertHas(code, 'objectivec', '#define', 'keyword')
  })

  it('covers every numeric literal form', () => {
    for (const literal of ['12.5', '0x40', '1e-9', '0b100', '3']) {
      assertHas(code, 'objectivec', literal, 'number')
    }
  })

  it('separates the two comment forms', () => {
    assertHas(code, 'objectivec', '/** Posted once a fetch settles, successfully or not. */', 'comment.doc')
    assertHas(code, 'objectivec', '//  ImageCache.m', 'comment')
  })
})
