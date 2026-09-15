import type { Grammar } from '../core/types'

/**
 * HTTP messages, the way API documentation and `.http` request files show them.
 *
 * HTTP has no keywords to speak of — a message is positional — so the grammar
 * is a state machine over the parts of a message rather than a word list:
 *
 * - the request target gets its own state, so a query string comes apart into
 *   parameters instead of rendering as one undifferentiated URL
 * - a header name is only matched from the start of a line, which is the only
 *   way to tell it from the colons inside `Host: localhost:8080` or a timestamp
 * - the blank line after the headers switches into the body, where JSON — the
 *   body that actually shows up in API docs — is highlighted as JSON
 *
 * Comments are not part of HTTP. The `#` and `//` lines and the `###` separator
 * come from the request-file format editors and REST clients use, and they are
 * recognised outside the body only, where a `#` is far more likely to be data.
 *
 * What it does not model: a method has to be uppercase, a body that is not JSON
 * — form-encoded, XML, multipart — renders as plain text, and chunk sizes are
 * not distinguished from the chunks around them.
 */

/**
 * The methods RFC 9110 defines. Doubles as the anchor for "a new message starts
 * here", which is how a body knows where it ends.
 */
const METHOD = 'GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS|TRACE|CONNECT'

/** `HTTP/1.1`, `HTTP/2` — scoped in three pieces so the version reads as a number. */
const VERSION = '(HTTP)(/)(\\d(?:\\.\\d)?)'

const http: Grammar = {
  name: 'http',
  aliases: ['https'],
  states: {
    /** The head of a message: request or status line, then headers. */
    root: {
      rules: [
        { match: '^[ \\t]*(?:#|//)[^\\n]*', scope: 'comment' },

        // Request line. The version at the end of it is left to the rule below,
        // so this only has to get as far as the target.
        {
          match: `^(${METHOD})([ \\t]+)`,
          scope: ['keyword.control', null],
          push: 'target',
        },

        // Status line. The reason phrase has no delimiter in front of it and
        // runs to the end of the line, so it is claimed here rather than left
        // to fall through as unscoped text.
        {
          match: `^${VERSION}([ \\t]+)(\\d{3})([ \\t]*)([^\\r\\n]*)`,
          scope: ['keyword', 'punctuation.delimiter', 'number', null, 'number', null, 'constant'],
        },
        {
          match: VERSION,
          scope: ['keyword', 'punctuation.delimiter', 'number'],
        },

        // A header name, plus the whitespace around its colon so the value
        // state starts on the value itself.
        {
          match: '^([A-Za-z][\\w-]*)([ \\t]*)(:)([ \\t]*)',
          scope: ['property', null, 'punctuation.delimiter', null],
          push: 'header-value',
        },

        // The blank line ends the headers. `set` rather than `push`: the head
        // of this message is over and never resumes.
        //
        // Matched as two line breaks rather than as an empty line, because a
        // real message uses CRLF and JavaScript treats a lone `\r` as a line
        // terminator: `^` matches between the `\r` and the `\n`, so an anchored
        // "empty line" pattern fires inside every CRLF pair.
        { match: '\\r?\\n[ \\t]*\\r?\\n', set: 'body' },
      ],
    },

    /**
     * A request target. `link` covers the path; the query string is taken apart
     * because that is where the interesting part of a documented request is.
     */
    target: {
      default: 'link',
      rules: [
        // Anchored on the `?`/`&` that introduces the name, both so a bare word
        // in a path cannot look like a parameter and so the scan is not retried
        // at every column of the line. The name stops at the next separator as
        // well as at the `=`, so a target that is nothing but `?` costs one
        // character per `?` rather than a rescan of the rest of the line.
        {
          match: '([?&])([^?&=\\s]*)(=)',
          scope: ['punctuation.delimiter', 'variable.parameter', 'operator'],
        },
        { match: '[?&#]', scope: 'punctuation.delimiter' },
        // The target ends at the first space — what follows is the version, and
        // the root state owns that. Zero width, so the space stays unscoped.
        { match: '(?=[ \\t])', pop: true },
        { match: '$', pop: true },
      ],
    },

    /** A header value: everything after the colon, ending with the line. */
    'header-value': {
      default: 'string',
      rules: [
        { match: '$', pop: true },
        // `charset=utf-8`, `q=0.9`, `session=a3fWa`. The lookbehind keeps the
        // name from being retried at every column of the line, and matches the
        // space the header rule already consumed so the first parameter of a
        // value counts too.
        {
          match: '(?<=[ \\t;,:])([\\w.-]+)(=)',
          scope: ['variable.parameter', 'operator'],
        },
        { match: 'https?://[^\\s;,]+', scope: 'link' },
        // A number has to stand alone: `348`, `:8080`, `q=0.9`. Held off by the
        // characters a token is built from, so the `8` of `utf-8` and the digits
        // buried in a JWT or an ETag stay part of the value.
        { match: '(?<![\\w.-])\\d+(?:\\.\\d+)*(?![\\w-])', scope: 'number' },
        { match: '[;,]', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * The body. JSON is highlighted as JSON; XML, form-encoded and plain bodies
     * fall through unscoped rather than being guessed at, which is the quiet
     * failure rather than the loud one.
     */
    body: {
      rules: [
        // One document holds several messages, so the body ends where the next
        // one starts: a `###` separator, a status line, or a request line. None
        // of the three can begin a line of JSON — a plain-text body that starts
        // a line with `GET ` is read as a new message, which is the price of
        // supporting multi-message documents at all.
        { match: `^(?=###|HTTP/\\d|(?:${METHOD})[ \\t])`, set: 'root' },

        // A comment introducing the next message also ends the body, but only
        // when the message starts on the very next line. A bare `^#` exit
        // would be wrong far more often than right — `#` is ordinary data in a
        // plain-text or form-encoded body, and misreading one as a separator
        // would hand the rest of the body to `root`.
        //
        // The lookahead spans exactly one line and holds no repetition group.
        // An earlier version matched the whole run — `(?:…\n)+` — which reads
        // better and is O(n²): it scans the run, fails on the tail, backtracks
        // a line at a time, and is retried at every line start. A body of 64 KB
        // of `#` lines (a Dockerfile, a `.env`, a `//`-licensed script) took
        // 10.8 s. The seed table in `test/languages.test.ts` cannot reach this
        // state, so nothing caught it.
        //
        // The cost of the narrower form: in a run of several comment lines only
        // the last is scoped, since only it sits directly above the message.
        {
          // No `[ \t]*` before the message start: `root` anchors its request
          // and status rules at column 0, so accepting an indented one here
          // exits the body to a state that cannot parse what the lookahead
          // matched, leaving the line unscoped and reading the line after it
          // as a header.
          match: `^(?=[ \\t]*(?://|#)[^\\n]*\\n(?:###|HTTP/\\d|(?:${METHOD})[ \\t]))`,
          set: 'root',
        },

        // A string followed by `:` is a key, at any depth.
        {
          match: '("(?:[^"\\\\\\n]|\\\\.)*")([ \\t]*)(:)',
          scope: ['property', null, 'punctuation.delimiter'],
        },
        { match: '"', scope: 'string', push: 'string' },

        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        {
          match: '-?\\b\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },
        { match: '[{}\\[\\]]', scope: 'punctuation.bracket' },
        { match: '[,:]', scope: 'punctuation.delimiter' },
      ],
    },

    string: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u[0-9a-fA-F]{4}|["\\\\/bfnrt])',
          scope: 'string.escape',
        },
        { match: '"', scope: 'string', pop: true },
        // A JSON string cannot hold a raw newline, so an unterminated quote in
        // a truncated body stops at the line instead of eating the rest of it.
        { match: '$', pop: true },
      ],
    },
  },
}

export default http
