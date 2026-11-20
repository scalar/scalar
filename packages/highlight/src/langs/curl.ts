import type { Grammar } from '../core/types'

/**
 * cURL command lines.
 *
 * A curl invocation is a shell command, but reading one is nothing like
 * reading a shell script: what matters is the request method and which flag
 * carries which value, not control flow. `@scalar/code-highlight` shipped a
 * bespoke curl grammar for that reason and `code.css` styles
 * `.hljs.language-curl` to match it, so this mirrors that scoping rather than
 * deferring to bash — which leaves `curl` and the method word unscoped.
 *
 * Flags are matched but left unscoped. They read as plain text, and any class
 * they carried would be shared with values that should be coloured: `-d` and
 * the JSON `true` in its body would both be `hljs-literal`.
 */

/** The methods `--request` and `-X` accept. Matched case-insensitively. */
const METHODS = 'get|post|put|patch|delete|head|options|trace|connect'

/** The flags whose value can be a JSON request body. */
const DATA_FLAGS = '-d|--data|--data-raw|--data-binary|--data-ascii|--json'

/**
 * A backslash that ends the line continues the command on the next one. It is
 * layout, not part of any value, so it reads as punctuation.
 */
const LINE_CONTINUATION = { match: '\\\\$', scope: 'punctuation' }

const curl: Grammar = {
  name: 'curl',
  states: {
    root: {
      // Flags are case-sensitive: `-d` sends a body and `-D` names a file to
      // dump headers into, `-F` sends a form and `-f` fails on HTTP errors.
      rules: [
        LINE_CONTINUATION,

        // curl itself does not care about the case of a method, and neither did
        // the grammar this replaces, so the command and the method are matched
        // in any case.
        { match: '\\b[cC][uU][rR][lL]\\b', scope: 'keyword' },
        { match: '(^|\\s)(--request|-X)(?=\\s)', push: 'method' },

        { match: `(^|\\s)(${DATA_FLAGS})(?![\\w-])`, push: 'data' },

        // Anchored to a boundary so the hyphens inside a URL or a header name
        // are not mistaken for flags, and consumed whole so a digit inside one
        // (`--http2`) is not read as a number.
        { match: '(^|\\s)--[A-Za-z][\\w-]*' },
        { match: '(^|\\s)-[A-Za-z](?![\\w-])' },

        // An escaped character outside quotes is literal. It has to come before
        // the quote rules: `'it'\''s'` is how a single quote is written inside
        // a single-quoted value (close, escaped quote, reopen), and reading that
        // `\'` as the start of a string inverts the rest of the line.
        { match: '\\\\[^\\r\\n]', scope: 'string.escape' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },

        { match: '\\b\\d+(?:\\.\\d+)?\\b', scope: 'number' },
      ],
    },

    method: {
      ignoreCase: true,
      rules: [
        // The method is the most useful token on the line, so it carries its
        // own scope instead of blending into the flag that introduces it.
        { match: `(\\s+)(${METHODS})\\b`, scope: [null, 'symbol'], pop: true },
        { match: '(?=[\\s\\S])', pop: true },
      ],
    },

    // The value after a data flag. A single-quoted value that opens an object
    // or an array is highlighted as JSON, so the request body stands apart from
    // the header and credential strings around it. Anything else (form fields,
    // `@file`, a double-quoted body full of `\"`) goes back to the root rules.
    data: {
      rules: [
        LINE_CONTINUATION,
        { match: '\\s+' },
        { match: "'(?=\\s*[\\[{])", scope: 'string', set: 'json-quoted' },
        { match: '(?=[\\s\\S])', pop: true },
      ],
    },
    'json-quoted': {
      rules: [
        { match: "'", scope: 'string', pop: true },
        { match: '(?=[\\s\\S])', push: 'json-body' },
      ],
    },
    'json-body': {
      // Without the JSON grammar registered, the body is one string, as before.
      default: 'string',
      // `'\''` and `'"'"'` are the shell writing an apostrophe, not the end of
      // the body, so they are holes: JSON reads straight across them and a
      // string value such as `"it'\''s"` stays one string. snippetz writes the
      // first; the second is common in hand-written examples.
      embed: { language: 'json', until: "'", holes: `'\\\\''|'"'"'` },
      rules: [],
    },

    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        // `$(...)` runs a command, so it reads as a value rather than text.
        { match: '\\$\\(', scope: 'variable', push: 'subshell' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    subshell: {
      default: 'variable',
      rules: [{ match: '\\)', scope: 'variable', pop: true }],
    },

    // Single quotes are literal in the shell, so nothing expands inside them.
    'string-single': {
      default: 'string',
      rules: [{ match: "'", scope: 'string', pop: true }],
    },
  },
}

export default curl
