import type { Grammar } from '../core/types'

/**
 * nginx configuration files.
 *
 * nginx has several hundred directives and no way to tell them apart by
 * spelling, so this grammar reads the *shape* of a statement instead of
 * shipping a name list:
 *
 * - the first word of a statement is the directive; a word anywhere else is an
 *   argument, which is what keeps `proxy_set_header` and `Host` distinct
 * - a directive whose line ends in `{` opens a context and reads as a keyword,
 *   so `server {` and the `server 10.0.0.1:80;` inside an `upstream` — the same
 *   word, two meanings — do not collide
 * - `~`, `~*` and `rewrite` hand their operand to a state that takes one whole
 *   word, so a regex may contain `{`, `}` or a quoted `;` without derailing the
 *   block structure
 *
 * Values are separated too: `$variables` expand inside quotes the way nginx
 * expands them, paths and URLs are literals, and `10m`/`30s`/`1d` split into a
 * number and a unit.
 */

/**
 * A directive name — always the first word of a statement.
 *
 * The trailing `\b` changes nothing about what matches, because `\w*` is greedy
 * and the position after it is a boundary already. It is there to stop the
 * engine backtracking into the name when the `OPENS_BLOCK` lookahead after it
 * fails: without it every shorter prefix of the name re-runs that 300-character
 * scan, which is a second of CPU on a single long word.
 */
const NAME = '[A-Za-z_]\\w*\\b'

/**
 * Where a statement may begin: the start of a line, or straight after the `;`
 * or `{` that ended the previous one. Anchoring here is what lets the same word
 * be a directive in one column and a bare argument in another, and it keeps the
 * rule from being retried at every column of a long line.
 */
const STATEMENT = '(?:^|(?<=[;{]))[ \\t]*'

/**
 * The rest of the line is `… {`, so this directive opens a context.
 *
 * The scan stops at `;` and the brace has to end the line, which is what keeps
 * a `{` inside a rewrite regex (`^/a{2}$ /b last;`) or inside a quoted value
 * from promoting an ordinary directive. A trailing comment after the brace is
 * allowed because it is common. Each run is capped at 300 characters so a
 * pathological line cannot make this quadratic.
 *
 * Every run stops at `{` rather than running to the cap, and at most three
 * braces may come before the one that opens the block. That bound is what makes
 * the check cheap on brace-dense input: a line of `${a${a` is a statement start
 * every three characters, and letting the scan try every brace in range costs
 * the full window at each one — a hundred times what the line is worth. Three
 * covers `^/v[0-9]{1,2}/x$ {` and anything else written by hand; past that the
 * directive reads as a simple one, the same way the one-liner below does.
 *
 * The heuristic misses the one-liner `location / { return 404; }`, which reads
 * as a simple directive. Only the colour is wrong — the braces still nest.
 */
const OPENS_BLOCK = '(?=[^;{\\n]{0,300}(?:\\{[^;{\\n]{0,300}){0,3}\\{[ \\t\\r]*(?:#[^\\n]*)?$)'

/**
 * An unquoted regular expression operand: one whitespace-delimited word.
 *
 * `{` and `}` are ordinary characters here, so `^/v[0-9]{1,2}/x$` stays one
 * token and its braces never reach the block rules. A leading `{` is refused
 * anyway, so a `location ~` with a missing operand cannot swallow the body. A
 * `)` only continues the operand when something non-terminal follows it, which
 * keeps the closing paren of `if ($x ~ ^(a|b)$)` out of the regex; the cost is
 * that a regex genuinely ending in `)` loses its last character, and quoting it
 * makes it exact again.
 */
const REGEX_WORD = '[^\\s;{](?:[^\\s;)]|\\)(?=[^\\s;]))*'

const nginx: Grammar = {
  name: 'nginx',
  aliases: ['nginxconf', 'nginx-conf'],
  states: {
    root: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },

        // `rewrite` is the one directive whose first argument is a bare regex
        // with no `~` to announce it, so it hands over explicitly.
        {
          match: `${STATEMENT}(rewrite)\\b`,
          scope: ['property'],
          push: 'regex',
        },

        { match: `${STATEMENT}(${NAME})${OPENS_BLOCK}`, scope: ['keyword'] },
        { match: `${STATEMENT}(${NAME})`, scope: ['property'] },

        // Quotes get a state because nginx allows a value to run across lines
        // and expands `$variables` inside single quotes as well as double.
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { include: 'variables' },

        // `~` and `~*` and their negations always introduce a regex, whether in
        // a `location`, an `if`, a `map` key or a `server_name`.
        { match: '!?~\\*?', scope: 'operator', push: 'regex' },
        { match: '\\^~|!?=', scope: 'operator' },
        // The file tests of `if (-f $request_filename)`. `\B` is what keeps the
        // `-F` of a header name like `X-Forwarded-For` out of this.
        { match: '\\B-!?[fdex]\\b', scope: 'keyword.operator' },

        { match: '\\b(?:on|off)\\b', scope: 'boolean' },

        // Paths and URLs are most of what a config actually says, so they are
        // worth a colour. The scheme is capped rather than open-ended: an
        // unbounded scan for `://` would be retried at every dotted segment of
        // a long hostname, which is quadratic in the length of the line.
        { match: '\\b[a-z][a-z0-9+.-]{0,15}://[^\\s;{}$]*', scope: 'string' },
        // `(?<!\w)` keeps the slash of `application/json` and of `$uri/` out of
        // this: both read as one word rather than as a path.
        { match: '(?<!\\w)/[^\\s;{}$]*', scope: 'string' },

        // `10m`, `30s`, `1d`, and `127.0.0.1` as a single literal. The
        // lookbehind is what stops `TLSv1.2` from ending in a stray number.
        {
          match: '(?<![\\w.])(\\d+(?:\\.\\d+)*)([a-zA-Z]*)',
          scope: ['number', 'unit'],
        },

        { match: '\\{', scope: 'punctuation.bracket', push: 'block' },
        { match: '[()\\[\\]]', scope: 'punctuation.bracket' },
        { match: '[;:,]', scope: 'punctuation.delimiter' },
      ],
    },

    /** A `{ … }` body. Popping on `}` is the whole of how contexts nest. */
    block: {
      rules: [{ match: '\\}', scope: 'punctuation.bracket', pop: true }, { include: 'root' }],
    },

    variables: {
      rules: [
        { match: '\\$\\{[A-Za-z_]\\w*\\}', scope: 'variable' },
        // Covers `$host` and the `$1` capture references a rewrite produces.
        { match: '\\$\\w+', scope: 'variable' },
      ],
    },

    /**
     * The operand of a `~` match or of `rewrite`. Entered right after the
     * operator, so the run of spaces before the operand falls through unscoped,
     * and left again as soon as one operand has been taken.
     */
    regex: {
      rules: [
        // Nothing to take: `location ~ {`, a `#` where the operand should be,
        // or a line truncated mid-edit. Handing the `#` back to `root` is what
        // keeps a trailing comment a comment; a `#` *inside* an operand starts
        // later than the operand does, so leftmost matching still gives the
        // whole word to the regex rule below.
        { match: '(?=[;{#\\n])', pop: true },
        // A quoted operand is the only way to write a regex holding a `;`, and
        // it is still a regex rather than a string.
        { match: '"[^"\\n]{0,512}"', scope: 'regexp', pop: true },
        { match: "'[^'\\n]{0,512}'", scope: 'regexp', pop: true },
        { match: REGEX_WORD, scope: 'regexp', pop: true },
      ],
    },

    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\[\\s\\S]', scope: 'string.escape' },
        { include: 'variables' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [
        { match: '\\\\[\\s\\S]', scope: 'string.escape' },
        { include: 'variables' },
        { match: "'", scope: 'string', pop: true },
      ],
    },
  },
}

export default nginx
