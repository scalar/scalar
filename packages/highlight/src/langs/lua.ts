import type { Grammar } from '../core/types'

/**
 * Lua.
 *
 * Three things make Lua awkward for a regex tokenizer, and each is answered by
 * the state machine rather than by a cleverer pattern:
 *
 * - Long brackets are level-matched. `[==[ … ]==]` ends only at a closer with
 *   the same number of `=`, so a `]=]` inside it is content. That is exactly
 *   what a backreference is for, and backreferences are rejected here, so
 *   levels 0 to 2 get one state each and everything deeper shares a state.
 * - `--`, `--[[` and `---` all start from the same two characters. The regex
 *   engine takes the leftmost match, so `---[[` reads as the doc comment it is
 *   rather than as a long comment starting one character in.
 * - `{` is always a table constructor in Lua — blocks use `do … end` — so a
 *   state can tell the key in `{ mode = "fast" }` from the plain local in
 *   `local a, mode = 1, "fast"`.
 *
 * Ordinary locals deliberately match no rule and inherit the block foreground,
 * which keeps both the markup and the visual noise down.
 */

const ID = '[A-Za-z_]\\w*'

/**
 * What has to follow a name for it to be a call.
 *
 * A single string or table argument may drop the parentheses, so `require "x"`,
 * `setup{…}` and `f[[…]]` are calls as much as `f(x)` is. The bracket form needs
 * a second `[` because `t[1]` is an index, not a call.
 */
const CALL = '(?=[ \\t]*(?:[({"\']|\\[=*\\[))'

/** Standard library tables. Their members are builtins; `mymod.insert` is not. */
const LIB = '(?:coroutine|debug|io|math|os|package|string|table|utf8)'

/**
 * `\65`, `\x41`, `\u{1F6B2}`, `\z` (skip the following whitespace, newlines
 * included) and a `\` line continuation.
 *
 * `\z` and the continuation have to consume their trailing whitespace here, or
 * the `$` rule that closes an unterminated string would fire on the newline
 * they are explicitly there to swallow.
 */
const ESCAPE = '\\\\(?:x[0-9a-fA-F]{2}|u\\{[0-9a-fA-F]+\\}|z\\s*|\\d{1,3}|\\r?\\n|[abfnrtv\\\\"\'])'

const lua: Grammar = {
  name: 'lua',
  states: {
    root: {
      rules: [
        { match: '^#![^\\n]*', scope: 'comment' },

        // ---- comments ------------------------------------------------------
        // LDoc and EmmyLua both open with three dashes. `(?!-)` keeps a rule of
        // `-----` separators out of the documentation colour, and the tag is
        // pulled out of the line so `---@param` reads as an annotation.
        {
          match: '(---(?!-)[ \\t]*)(@\\w+)([^\\n]*)',
          scope: ['comment.doc', 'decorator', 'comment.doc'],
        },
        { match: '---(?!-)[^\\n]*', scope: 'comment.doc' },

        // Long comments, most specific level first. `--[=[` also matches the
        // deep pattern, so the exact levels have to be tried before it.
        { match: '--\\[\\[', scope: 'comment', push: 'long-comment-0' },
        { match: '--\\[=\\[', scope: 'comment', push: 'long-comment-1' },
        { match: '--\\[==\\[', scope: 'comment', push: 'long-comment-2' },
        { match: '--\\[={3,}\\[', scope: 'comment', push: 'long-comment-n' },
        { match: '--[^\\n]*', scope: 'comment' },

        // ---- strings -------------------------------------------------------
        { match: '\\[\\[', scope: 'string', push: 'long-string-0' },
        { match: '\\[=\\[', scope: 'string', push: 'long-string-1' },
        { match: '\\[==\\[', scope: 'string', push: 'long-string-2' },
        { match: '\\[={3,}\\[', scope: 'string', push: 'long-string-n' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },

        // ---- numbers -------------------------------------------------------
        // Hex first: `0x10` would otherwise read as `0` followed by a name. The
        // exponent of a hex float is `p`, not `e`, and it is decimal.
        {
          match: '\\b0[xX](?:[0-9a-fA-F]+(?:\\.[0-9a-fA-F]*)?|\\.[0-9a-fA-F]+)(?:[pP][-+]?\\d+)?',
          scope: 'number',
        },
        {
          match: '(?:\\b\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?',
          scope: 'number',
        },

        // ---- names and keywords --------------------------------------------
        // Varargs, ahead of the `..` operator that would claim the first two dots.
        { match: '\\.\\.\\.', scope: 'variable.builtin' },

        // Labels live in their own namespace, so they are neither a variable
        // nor a constant; `variable.special` is the closest thing the
        // vocabulary has to "a name that is not an ordinary name".
        {
          match: `(::)(${ID})(::)`,
          scope: ['punctuation.delimiter', 'variable.special', 'punctuation.delimiter'],
        },
        {
          match: `\\b(goto)([ \\t]+)(${ID})`,
          scope: ['keyword.control', null, 'variable.special'],
        },

        // A named definition hands the name to its own state. Consuming the
        // whole `function a.b:c` here instead would have to scope the receiver
        // too, and it cannot: `a` is an ordinary expression and deserves
        // whatever colour it has everywhere else in the file.
        {
          match: '\\bfunction(?=[ \\t]+[A-Za-z_])',
          scope: 'keyword.declaration',
          push: 'definition',
        },

        {
          match: '\\b(?:if|elseif|else|then|end|do|while|repeat|until|for|in|break|goto|return)\\b',
          scope: 'keyword.control',
        },
        { match: '\\b(?:function|local)\\b', scope: 'keyword.declaration' },
        { match: '\\b(?:and|or|not)\\b', scope: 'keyword.operator' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnil\\b', scope: 'constant.builtin' },

        // Lua 5.4 attribs. The chained comparison `a <const> b` is read as one
        // of these instead, which is the wrong answer to a question nobody asks.
        { match: '<(?:const|close)>', scope: 'decorator' },

        // `self` is a plain local that the `:` call syntax happens to declare.
        // A local named `self` outside a method gets the same colour, which is
        // the reading that is right on ordinary code.
        { match: '\\b(?:self|_G|_ENV|_VERSION)\\b', scope: 'variable.builtin' },

        // `table.insert` is a builtin, `obj.table.insert` is not: the member
        // rules below match at the leading `.`, which is further left, and the
        // engine prefers the leftmost match.
        {
          match: `\\b(${LIB})(\\.)(${ID})${CALL}`,
          scope: ['namespace', 'punctuation', 'function.builtin'],
        },
        {
          match: `\\b(${LIB})(\\.)(${ID})`,
          scope: ['namespace', 'punctuation', 'variable.builtin'],
        },

        // `:` only ever introduces a method, so no call lookahead is needed.
        { match: `(:)(${ID})`, scope: ['punctuation', 'function.method'] },
        {
          match: `(\\.)(${ID})${CALL}`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        {
          match:
            '\\b(?:assert|collectgarbage|dofile|error|getmetatable|ipairs|load|loadfile|loadstring|next|pairs|pcall|print|rawequal|rawget|rawlen|rawset|require|select|setmetatable|tonumber|tostring|type|unpack|xpcall)\\b',
          scope: 'function.builtin',
        },

        // SCREAMING_CASE reads as a constant and CapWords as a type, which is
        // how Lua spells module constants and the tables it uses as classes.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },
        { match: `\\b${ID}${CALL}`, scope: 'function.call' },

        // ---- syntax --------------------------------------------------------
        { match: '\\.\\.|//|<<|>>|[=~<>]=|[-+*/%^#&|~<>=]', scope: 'operator' },

        // The opening brace is matched together with the first key, which is
        // both how the key is recognised and why every alternative in the
        // constructor state still starts with a literal character — a rule
        // beginning with a lookbehind costs the engine its first-character
        // scan, and measured 15x on a constructor full of whitespace.
        {
          match: `(\\{)([ \\t\\r\\n]*)(${ID})(?=[ \\t]*=(?!=))`,
          scope: ['punctuation.bracket', null, 'property'],
          push: 'table-constructor',
        },
        {
          match: '\\{',
          scope: 'punctuation.bracket',
          push: 'table-constructor',
        },
        { match: '[()\\[\\]}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
        { match: '\\.', scope: 'punctuation' },
      ],
    },

    /**
     * The name of a `function` definition, up to and including its last
     * segment. `function a.b.c:d()` is a receiver, two fields and a method, and
     * the receiver falls through to `root` so it keeps the colour it has at
     * every other mention.
     *
     * A definition never spans a line, so `$` pops rather than letting a
     * malformed one leak into the rest of the file.
     */
    definition: {
      rules: [
        // The `:` form takes an implicit `self`, so it is a method and the `.`
        // form is a plain function that happens to live in a table.
        {
          match: `(:)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'function.method'],
          pop: true,
        },
        {
          match: `(\\.)([ \\t]*)(${ID})(?=[ \\t]*[.:])`,
          scope: ['punctuation', null, 'variable.member'],
        },
        {
          match: `(\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'function'],
          pop: true,
        },
        // Both `\b`s are load-bearing. The trailing one stops `Trips.new` from
        // matching the shorter `Trip`, since backtracking is happy to give up
        // the `s` to make the negative lookahead succeed. The leading one stops
        // the rule being retried at every column of a name it just rejected,
        // which is quadratic in the length of the name.
        { match: `\\b${ID}\\b(?![ \\t]*[.:])`, scope: 'function', pop: true },
        { match: '$', pop: true },
        { include: 'root' },
      ],
    },

    /**
     * A table constructor, entered at `{`. It exists only so that a name that
     * opens an entry can be scoped as a key; everything else is ordinary code.
     *
     * Requiring the comma is what keeps a bare `{ a b }` from reading as a key,
     * and the cost is that `b` in `{ a; b = 1 }` renders unscoped: the semicolon
     * separator is legal Lua and almost never written.
     *
     * A comma is not enough on its own, because a module table of functions
     * puts whole statements inside the constructor and `local ok, err = f()` in
     * one of those bodies has the same shape as two keys. The `local-list` state
     * below eats the commas of a declaration list so they are never offered as
     * key separators.
     */
    'table-constructor': {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        // `local` cannot appear at constructor level, so a `local` here is
        // always inside a nested function body and its names are locals rather
        // than keys. Only the commas need handling, so the names are left to
        // `root` and colour the same in here as they do anywhere else.
        //
        // A comma has to follow the first name, so the far more common
        // `local x = 1` never enters the state and `local` keeps falling through
        // to `root`. That lookahead is also what guarantees the state pops: the
        // comma it promises can only be consumed by `local-list` itself.
        // `function` is excluded so `local function f` reaches the definition
        // rule; a variable named `functions` still gets in, since `\b` fails.
        {
          match: `\\blocal\\b(?=[ \\t]+(?!function\\b)${ID}[ \\t]*,)`,
          scope: 'keyword.declaration',
          push: 'local-list',
        },
        {
          match: `(,)([ \\t\\r\\n]*)(${ID})(?=[ \\t]*=(?!=))`,
          scope: ['punctuation.delimiter', null, 'property'],
        },
        { include: 'root' },
      ],
    },

    /**
     * The commas of a `local` declaration list inside a table constructor.
     *
     * Hiding a comma from the key rule is the whole job, so this state claims
     * commas and nothing else: the names fall through to `root` and keep the
     * colours they have at top level. Scoping them from here instead would make
     * `local Foo, Bar` inside `{ }` a different colour from the same line
     * outside it, which is the bug this state replaces.
     */
    'local-list': {
      rules: [
        // Another comma-terminated name follows, so the list continues.
        {
          match: `,(?=[ \\t\\r\\n]*${ID}[ \\t\\r\\n]*,)`,
          scope: 'punctuation.delimiter',
        },
        // The last comma of the list. Popping here rather than at the end of the
        // statement is deliberate: the key rule needs to match this comma to fire,
        // so consuming it is enough, and everything after the final name — `end`,
        // a later `, key =`, the closing `}` — stays the constructor's business.
        { match: ',', scope: 'punctuation.delimiter', pop: true },
        { include: 'root' },
      ],
    },

    // ---- short strings -------------------------------------------------------
    // A short string cannot span a line break of its own accord, so `$` pops
    // rather than letting one bad quote swallow the rest of the file.
    'string-double': {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: "'", scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    // ---- long brackets -------------------------------------------------------
    // One state per level, because the closer has to count the `=` the opener
    // used and a backreference cannot survive the rule merge. Levels past two
    // share a state that closes on any run of three or more, so
    // `[===[ a ]====] b ]===]` ends at the wrong closer. A level that deep is
    // chosen precisely to hold text containing other closers, so that is the
    // corner where this stops working — and it is a corner: levels 0 and 1 are
    // what real code writes.
    'long-string-0': {
      default: 'string',
      rules: [{ match: '\\]\\]', pop: true }],
    },
    'long-string-1': {
      default: 'string',
      rules: [{ match: '\\]=\\]', pop: true }],
    },
    'long-string-2': {
      default: 'string',
      rules: [{ match: '\\]==\\]', pop: true }],
    },
    'long-string-n': {
      default: 'string',
      rules: [{ match: '\\]={3,}\\]', pop: true }],
    },

    'long-comment-0': {
      default: 'comment',
      rules: [{ match: '\\]\\]', pop: true }],
    },
    'long-comment-1': {
      default: 'comment',
      rules: [{ match: '\\]=\\]', pop: true }],
    },
    'long-comment-2': {
      default: 'comment',
      rules: [{ match: '\\]==\\]', pop: true }],
    },
    'long-comment-n': {
      default: 'comment',
      rules: [{ match: '\\]={3,}\\]', pop: true }],
    },
  },
}

export default lua
