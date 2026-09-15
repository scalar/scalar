import type { Grammar } from '../core/types'

/**
 * Objective-C.
 *
 * The language is C plus a message-send syntax that reuses `[` and `:`, which
 * is exactly where a flat rule list falls over. Three small states carry the
 * weight:
 *
 * - `message` — pushed by every `[`, so a selector label (`doThing:`) and a
 *   no-argument message (`[obj description]`) can be told apart from a
 *   subscript (`dict[key]`) without a parser
 * - `method-return` / `method-name` / `method-sig` — a `- (void)foo:(id)bar`
 *   declaration, so the selector reads as a *definition* while the same
 *   selector in a message send reads as a call, and parameter names are not
 *   confused with the method name
 * - `property-attrs` — `nonatomic`, `copy` and friends are only keywords
 *   inside `@property (…)`; `copy` elsewhere is an ordinary message
 *
 * Ordinary identifiers deliberately match nothing and inherit the block's
 * foreground, which keeps both the markup and the grammar small.
 */

/** C identifiers; `\w` already covers digits and `_`. */
const ID = '[A-Za-z_]\\w*'

const objectivec: Grammar = {
  name: 'objectivec',
  aliases: ['objc', 'obj-c', 'objective-c'],
  states: {
    root: {
      rules: [{ include: 'code' }],
    },

    /**
     * Everything that is legal wherever an expression is. `message`,
     * `method-sig` and `property-attrs` all splice this in after their own
     * rules, so a construct only has to be described once.
     */
    code: {
      rules: [
        // ---- comments ------------------------------------------------------
        // Doc forms first: `//` would otherwise claim `///` as an ordinary
        // comment. Block comments run through a state rather than a lazy
        // `[\s\S]*?\*/`, so an unterminated one colours the rest of the file
        // instead of costing a full-file scan at every `/*`.
        { match: '//[/!][^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },
        // `(?!/)` keeps the empty comment `/**/` out of the doc branch.
        { match: '/\\*[*!](?!/)', scope: 'comment.doc', push: 'block-doc' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },

        // ---- preprocessor --------------------------------------------------
        // The header path is scoped as a string in both spellings; the `<…>`
        // scan stops at the newline so a stray `<` cannot run away.
        {
          match: `^[ \\t]*(#[ \\t]*(?:import|include))([ \\t]*)(<[^>\\n]*>|"[^"\\n]*")`,
          scope: ['keyword.import', null, 'string'],
        },
        // Every other directive: `#define`, `#if`, `#pragma mark`, `#endif`.
        { match: '^[ \\t]*#[ \\t]*\\w+', scope: 'keyword' },

        // ---- method declarations -------------------------------------------
        // `- (void)foo` / `+ (instancetype)bar`. Anchored to the line start and
        // required to be followed by the return type's `(`, so a continuation
        // line beginning with a minus is still arithmetic. A statement that
        // wraps onto a line starting with `- (` is read as a method, which is
        // the trade every Objective-C highlighter makes.
        {
          match: '^[ \\t]*([-+])([ \\t]*)(\\()',
          scope: ['keyword.declaration', null, 'punctuation.bracket'],
          push: 'method-return',
        },

        // ---- @-directives ---------------------------------------------------
        // The name after `@interface`/`@implementation` is the class being
        // declared, which is worth telling apart from every other type name.
        // `@class A, B;` only marks `A`; the rest fall back to the CapWords
        // rule below, which lands on `type` anyway.
        {
          match: `(@(?:interface|implementation|protocol|class))([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        // Consume the `(` so the attribute list gets its own state.
        {
          match: '(@property)([ \\t]*)(\\()',
          scope: ['keyword.declaration', null, 'punctuation.bracket'],
          push: 'property-attrs',
        },
        // `@selector(imageForKey:retries:)` names a method, so the whole
        // selector reads as one; the scan stops at `)` and at the newline.
        {
          match: '(@selector)([ \\t]*)(\\()([^)\\n]*)(\\))',
          scope: ['keyword.operator', null, 'punctuation.bracket', 'function.method', 'punctuation.bracket'],
        },
        {
          match: '@(?:try|catch|finally|throw|synchronized|autoreleasepool)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '@(?:interface|implementation|protocol|end|property|synthesize|dynamic|class|public|private|protected|optional|required)\\b',
          scope: 'keyword.declaration',
        },
        { match: '@import\\b', scope: 'keyword.import' },
        {
          match: '@(?:selector|encode|available)\\b',
          scope: 'keyword.operator',
        },

        // ---- literals -------------------------------------------------------
        // The `@` of an NSString literal is a modifier on the literal, the way
        // Python's `r"…"` prefix is — scoped apart so `@"x"` and "x" read
        // differently.
        {
          match: '(@)(")',
          scope: ['string.special', 'string'],
          push: 'string',
        },
        { match: '"', scope: 'string', push: 'string' },
        // The boxing `@` of `@42`, `@YES`, `@(x + 1)`, `@[…]` and `@{…}`.
        { match: '@(?=[\\[({\\d]|YES\\b|NO\\b)', scope: 'operator' },
        // Capped rather than open-ended: a char literal holds at most a few
        // units (`'a'`, `'\n'`, the four-char codes Core Foundation still
        // uses), and an uncapped scan would rescan the line at every quote.
        { match: "'(?:[^'\\\\\\n]|\\\\.){1,8}'", scope: 'string' },

        // Hex and the binary literal Clang accepts, with the C integer suffixes.
        {
          match: '\\b0(?:[xX][0-9a-fA-F]+|[bB][01]+)[uUlL]*\\b',
          scope: 'number',
        },
        {
          match: '\\b\\d+\\.?\\d*(?:[eE][-+]?\\d+)?[uUlLfF]*\\b',
          scope: 'number',
        },
        { match: '\\.\\d+(?:[eE][-+]?\\d+)?[fF]?', scope: 'number' },

        // ---- keywords -------------------------------------------------------
        {
          match: '\\b(?:break|case|continue|default|do|else|for|goto|if|return|switch|while)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:auto|const|enum|extern|inline|static|struct|typedef|union|volatile|nullable|nonnull|_Nullable|_Nonnull|__block|__weak|__strong|__kindof|__bridge(?:_retained|_transfer)?)\\b',
          scope: 'keyword.declaration',
        },
        {
          match: '\\b(?:sizeof|typeof|__typeof__)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:YES|NO)\\b', scope: 'boolean' },
        { match: '\\b(?:nil|Nil|NULL)\\b', scope: 'constant.builtin' },
        { match: '\\b(?:self|super|_cmd)\\b', scope: 'variable.builtin' },

        // The language's own types plus the platform's scalar typedefs. Class
        // names — `NSString`, `UIImage` — go through the CapWords rule instead
        // and land on `type`: the framework is not the language.
        {
          match:
            '\\b(?:id|instancetype|Class|SEL|IMP|BOOL|void|char|short|int|long|float|double|signed|unsigned|size_t|u?int(?:8|16|32|64)_t|NSInteger|NSUInteger|NSTimeInterval|CGFloat)\\b',
          scope: 'type.builtin',
        },

        // ---- names ----------------------------------------------------------
        // Matched from the dot, so `foo.count` never reads as a bare builtin.
        {
          match: `(\\.)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // Before the CapWords rules, so `NSLog(…)` and `CGRectMake(…)` read as
        // calls rather than as types. Keywords are already claimed above, which
        // is what keeps `if (` and `sizeof(` out of this.
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },
        // SCREAMING_CASE is a constant, CapWords a type. Between them these
        // cover every framework class and macro without shipping a name list —
        // at the price of reading an enum case such as `NSUTF8StringEncoding`
        // as a type.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },

        // ---- syntax ---------------------------------------------------------
        {
          match: '\\.{3}|->|\\+\\+|--|<<=?|>>=?|&&|\\|\\||[-+*/%!&|^<>=]=?|[~?]',
          scope: 'operator',
        },
        // Every `[` opens a message state — see `message` for why a subscript
        // survives the assumption.
        { match: '\\[', scope: 'punctuation.bracket', push: 'message' },
        { match: '[()\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    // ---- comments ---------------------------------------------------------
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', pop: true }],
    },
    'block-doc': {
      default: 'comment.doc',
      rules: [{ match: '\\*/', pop: true }],
    },

    // ---- strings ------------------------------------------------------------
    string: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]+|[0-7]{1,3}|.)',
          scope: 'string.escape',
        },
        // printf placeholders, including Objective-C's `%@` and the positional
        // `%1$@` that localized format strings use.
        {
          // The flag and width runs are capped. Uncapped, `[-+ #0]*` and
          // `(?:\d+|\*)?` both accept `0`, so a `%` followed by a long run of
          // zeros makes the engine enumerate every split point before failing
          // on the missing conversion character — 64 KB of zeros took 17 s.
          match: '%(?:\\d{1,3}\\$)?[-+ #0]{0,6}(?:\\d{1,6}|\\*)?(?:\\.(?:\\d{1,6}|\\*))?(?:hh?|ll?|[Lzjtq])?[@%a-zA-Z]',
          scope: 'string.special',
        },
        { match: '"', scope: 'string', pop: true },
        // An unterminated literal ends at the line break rather than swallowing
        // the rest of the file.
        { match: '$', pop: true },
      ],
    },

    // ---- message sends ------------------------------------------------------
    /**
     * Pushed by every `[`, message send or subscript. `code` comes first so a
     * `default:` inside a block argument stays a keyword, and the two rules
     * below only fire where nothing else claimed the text — which is precisely
     * where a selector piece lives.
     */
    message: {
      rules: [
        { match: '\\]', scope: 'punctuation.bracket', pop: true },
        { include: 'code' },
        // A keyword selector piece. The colon has to touch the identifier, so
        // the spaced `a ? b : c` is safe; the unspaced `a?b:c` is not, and
        // reads `b` as a selector.
        { match: `\\b${ID}(?=:(?![:=]))`, scope: 'function.method' },
        // A no-argument message: `[obj description]`. The receiver has to end
        // the token before it, which is what keeps `dict[key]` (no space) and
        // `arr[i + n]` (a `+` before the space) out.
        {
          match: `(?<=[\\w\\]"\\)])[ \\t]+(${ID})(?=[ \\t]*\\])`,
          scope: ['function.method'],
        },
      ],
    },

    // ---- method declarations -------------------------------------------------
    /**
     * The return type, `(instancetype)`. Popped at the first `)`, so a block
     * return type — `- (void (^)(NSError *))handler` — closes early and reads
     * its second half as the selector; the state still ends where it should.
     */
    'method-return': {
      rules: [{ match: '\\)', scope: 'punctuation.bracket', set: 'method-name' }, { include: 'code' }],
    },

    /** The first identifier after the return type is always the selector. */
    'method-name': {
      rules: [
        { match: ID, scope: 'function', set: 'method-sig' },
        // A malformed signature must not scope the next line's identifier.
        { match: '\\n', pop: true },
      ],
    },

    /**
     * The rest of the signature: further selector pieces, and the parameters
     * they take. This is the definition site, so the pieces are `function`
     * where a message send would make them `function.method`.
     */
    'method-sig': {
      rules: [
        { match: '\\{', scope: 'punctuation.bracket', pop: true },
        { match: ';', scope: 'punctuation.delimiter', pop: true },
        { match: `\\b${ID}(?=:)`, scope: 'function' },
        // A parameter name is whatever follows its type's closing paren.
        { match: `(?<=\\))[ \\t]*(${ID})`, scope: ['variable.parameter'] },
        { include: 'code' },
      ],
    },

    // ---- property attributes -------------------------------------------------
    /** `nonatomic`, `copy` and `class` are keywords here and nowhere else. */
    'property-attrs': {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        {
          match: '\\b(?:nonatomic|atomic|strong|weak|copy|assign|retain|readonly|readwrite|class|getter|setter)\\b',
          scope: 'keyword',
        },
        // `getter=isEnabled` names a method, not a value.
        {
          match: `(=)([ \\t]*)(${ID}:?)`,
          scope: ['operator', null, 'function.method'],
        },
        { include: 'code' },
      ],
    },
  },
}

export default objectivec
