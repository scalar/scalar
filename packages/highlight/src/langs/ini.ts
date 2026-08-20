import type { Grammar } from '../core/types'

/**
 * INI, and the TOML superset most files labelled `ini` actually are.
 *
 * Two decisions shape the whole grammar:
 *
 * - A key is only a key where a key can start: at the beginning of a line, or
 *   inside an inline table. Everything after the separator is a value, in its
 *   own state, which is what stops `search = /usr/bin:/bin` from reading the
 *   second half of the path as another key.
 * - A value is only interesting where it is a literal. Bare values are left
 *   unscoped instead of guessed at — smaller, and right far more often than a
 *   rule that colours every word after an `=`.
 */

/**
 * A bare value, and the boundary a literal has to end on.
 *
 * A literal only counts when it is the whole token: `2.3` is not a number
 * inside the version `1.2.3`, and `on` is not a boolean inside the path
 * `/opt/on`. `TAIL` rules out the right-hand side. The left-hand side used to be
 * a matching lookbehind, but a rule that *starts* with one costs the merged
 * alternation its first-character scan for the whole state, and JavaScriptCore
 * charges dearly for that: 3x on plain `key = value` lines and 4x on
 * whitespace-heavy values. So `BARE` does the same job by consuming — it sits
 * last in `literals` and swallows the whole token, so the scanner never reaches
 * an interior position where a literal could start.
 *
 * The apostrophe is in the class so the `'` in `don't` is swallowed with the
 * word rather than opening a literal string. A real `'…'` is unaffected — the
 * string rules sit ahead of this one, so a quote only reaches `BARE` when it
 * opens nothing.
 *
 * `=` is deliberately not a token character: `port=8080` with no spaces is
 * ordinary INI and the number still has to be found there.
 */
const BARE = "[\\w.:+\\-/']+"
const TAIL = '(?![\\w.:+\\-/])'

/** TOML's escapes, minus the line continuation that only `"""` strings have. */
const ESCAPE = '\\\\(?:[btnfr"\\\\]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})'
/**
 * Inside `"""` a trailing backslash joins the line to the next one. It is
 * deliberately absent from `ESCAPE`: a single-quoted `"` string is single-line,
 * so letting it eat a newline there would defeat that state's `$` guard and
 * colour the following line as string content.
 */
const ML_ESCAPE = '\\\\(?:[btnfr"\\\\]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|\\r?\\n)'

/**
 * RFC 3339 offset date-times, plus the local date and local time TOML also
 * allows. Kept ahead of `NUMBER`, whose decimal branch would otherwise claim
 * the year and leave `-05-27` behind.
 */
const DATE =
  '\\d{4}-\\d{2}-\\d{2}(?:[Tt ]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:[Zz]|[-+]\\d{2}:\\d{2})?)?|\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?'

/**
 * Every numeric form, in one alternation rather than one rule each: the merged
 * state regex tries every alternative at every position, and each of these
 * would otherwise re-evaluate the boundary guards below.
 */
const NUMBER =
  '0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*|' +
  '[-+]?(?:\\d(?:_?\\d)*(?:\\.\\d(?:_?\\d)*)?(?:[eE][-+]?\\d(?:_?\\d)*)?|inf|nan)'

/**
 * A key path followed by its separator, as a lookahead: the key state does the
 * scoping, this only decides whether the line has a key at all.
 *
 * Indentation is part of the run rather than a `[ \t]*` prefix around it, and
 * that is the whole point. When both could match a space there were two
 * readings of every leading blank, and the greedy prefix replayed the run from
 * each of them: a line of 1000 spaces cost 200 ms and each doubling cost 4x.
 * Now no character matches two alternatives, so any prefix parses exactly one
 * way and the run simply stops on the separator, which is in none of them.
 *
 * The cap bounds the single attempt the `^` anchor allows per line; a key
 * longer than it renders unscoped.
 */
const KEY_AHEAD = '(?=(?:[\\w.\\- \\t]|"[^"\\n]{0,128}"|\'[^\'\\n]{0,128}\'){1,256}[=:])'

/** An inline table's key: the same three spellings, capped since nothing anchors the end. */
const IT_KEY = '[\\w.\\-]{1,64}|"[^"\\n]{0,128}"|\'[^\'\\n]{0,128}\''

const ini: Grammar = {
  name: 'ini',
  aliases: ['toml', 'cfg', 'conf', 'properties'],
  states: {
    root: {
      rules: [
        { include: 'comment' },
        // `[[a.b]]` and `[a.b]` differ only in the bracket run, and the header
        // state pops on either, so one rule covers both.
        {
          match: '^[ \\t]*(\\[\\[?)',
          scope: ['punctuation.bracket'],
          push: 'header',
        },
        // Zero-width: the key state re-reads the key path so the dots and
        // quotes inside it can be scoped apart from the segments.
        { match: `^${KEY_AHEAD}`, push: 'key' },
      ],
    },

    comment: {
      rules: [
        // A whole-line comment. `!` only opens one at the start of a line,
        // which is the `.properties` dialect's rule and nobody else's.
        { match: '^[ \\t]*([!#;][^\\n]*)', scope: ['comment'] },
        // A trailing comment, which has to be preceded by whitespace. That is
        // what keeps the `#` in `pass#word` and in a URL fragment out of the
        // comment. It is the TOML reading and it is wrong for the dialects
        // where a `#` after the separator is just another value character.
        { match: '([ \\t])([#;][^\\n]*)', scope: [null, 'comment'] },
      ],
    },

    /** `[table]`, `[a.b]` and `[[array.of.tables]]`, up to the closing bracket run. */
    header: {
      rules: [
        { match: '\\]{1,2}', scope: 'punctuation.bracket', pop: true },
        { match: '"[^"\\n]{0,128}"|\'[^\'\\n]{0,128}\'', scope: 'namespace' },
        { match: '[\\w\\-]+', scope: 'namespace' },
        { match: '\\.', scope: 'punctuation.delimiter' },
        // An unclosed header ends with its line rather than eating the file.
        { match: '$', pop: true },
      ],
    },

    /** The key path only — entered on a lookahead that already saw the separator. */
    key: {
      rules: [
        { match: '[=:]', scope: 'operator', set: 'value' },
        { match: '"[^"\\n]{0,128}"|\'[^\'\\n]{0,128}\'', scope: 'property' },
        { match: '[\\w\\-]+', scope: 'property' },
        { match: '\\.', scope: 'punctuation.delimiter' },
        // Unreachable through the lookahead, but a truncated buffer is cheap to
        // be safe about.
        { match: '$', pop: true },
      ],
    },

    /**
     * Everything after the separator, to the end of the line. A value that
     * opens an array or a multi-line string pushes a state that outlives the
     * line, so the pop below only fires once that state has closed.
     */
    value: {
      rules: [{ include: 'comment' }, { match: '$', pop: true }, { include: 'literals' }],
    },

    literals: {
      rules: [
        { match: '"""', scope: 'string', push: 'ml-basic' },
        { match: "'''", scope: 'string', push: 'ml-literal' },
        { match: '"', scope: 'string', push: 'basic' },
        { match: "'[^'\\n]*'", scope: 'string' },

        // The vocabulary has no date scope, and a timestamp is a numeric
        // literal, so `number` is the closest reading of one.
        { match: `(?:${DATE}|${NUMBER})${TAIL}`, scope: 'number' },

        // `yes`/`no`/`on`/`off` are not TOML, but they are how classic INI
        // spells a boolean. The cost is a value that is genuinely the word
        // "no" reading as one.
        { match: `(?:true|false|yes|no|on|off)${TAIL}`, scope: 'boolean' },

        { match: '\\[', scope: 'punctuation.bracket', push: 'array' },
        // The opening brace is matched together with the first key of the
        // table, which is how that key gets anchored — see `inline-table`.
        {
          match: `(\\{)([ \\t]*)(${IT_KEY})([ \\t]*)([=:])`,
          scope: ['punctuation.bracket', null, 'property', null, 'operator'],
          push: 'inline-table',
        },
        { match: '\\{', scope: 'punctuation.bracket', push: 'inline-table' },
        { match: ',', scope: 'punctuation.delimiter' },

        // Last, and unscoped. Taking a whole bare token in one match is what
        // gives every literal above its left-hand boundary: the scanner is only
        // ever offered the head of a token, never a position inside one. Drop
        // this rule and `1.2.3` starts finding a number in `2.3` again.
        { match: BARE },
      ],
    },

    /** A TOML array, which may span lines and carry comments between elements. */
    array: {
      rules: [
        { match: '\\]', scope: 'punctuation.bracket', pop: true },
        { include: 'comment' },
        { include: 'literals' },
      ],
    },

    /**
     * An inline table, entered on its opening brace. There is no `^` to anchor
     * a key to inside a one-line construct, so the delimiter in front of it is
     * consumed instead: the brace above takes the first key and the comma here
     * takes every later one. Unanchored, the scan was retried at every column
     * of every word and backtracked up to the cap each time.
     */
    'inline-table': {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        // The dotted path stays in one `property` token rather than paying for
        // another state. The gap takes line breaks because a comma is how a
        // multi-line inline table is written, and taking it here is also what
        // carries the table past the `$` below.
        {
          match: `(,)([ \\t\\r\\n]*)(${IT_KEY})([ \\t]*)([=:])`,
          scope: ['punctuation.delimiter', null, 'property', null, 'operator'],
        },
        { include: 'literals' },
        // A half-typed `a = {` is what an editor holds after every keystroke,
        // and without this the rest of the document stayed inside the table and
        // lost every key. So the table ends with its line, exactly as an
        // unclosed header and an unterminated string do — a real one is either
        // closed on that line or carried onto the next by the comma rule above.
        { match: '$', pop: true },
      ],
    },

    basic: {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
        // An unterminated string stops at the line break instead of colouring
        // the rest of the file.
        { match: '$', pop: true },
      ],
    },
    'ml-basic': {
      default: 'string',
      rules: [
        { match: ML_ESCAPE, scope: 'string.escape' },
        { match: '"""', scope: 'string', pop: true },
      ],
    },
    /** `'''…'''` is literal: no escapes, so the only rule is the closing run. */
    'ml-literal': {
      default: 'string',
      rules: [{ match: "'''", scope: 'string', pop: true }],
    },
  },
}

export default ini
