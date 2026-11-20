import type { Grammar } from '../core/types'
import { shellContinuation, shellEscape } from './shared/shell'

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

/** The long flags whose value can be a JSON request body. */
const LONG_DATA_FLAGS = '--data(?:-raw|-binary|-ascii)?|--json'

// Only switches that take no value can precede d in a short-option group.
// Keep this in sync with curl's ARG_BOOL and ARG_NONE short options.
const SHORT_SWITCHES = '012346#:aBfGgIijkJlLMnNOpqRsSvVZ'

/** The shell can insert a literal apostrophe by closing and reopening the quote. */
const SHELL_APOSTROPHES = String.raw`'\\''|'"'"'`
const APOSTROPHE_ESCAPE = new RegExp(SHELL_APOSTROPHES, 'g')
const SHELL_CONTINUATION = String.raw`\\\r?\n`
// A line splice can still join another segment to the current shell argument.
const SHELL_WORD_END = String.raw`(?=(?:${SHELL_CONTINUATION})*(?:[ \t\n;&|<>()]|\r\n|(?![\s\S])))`

// The closing quote must end the shell argument. A segment like '[1]'='[2]'
// is one argument, so its first segment alone is not a JSON body.
const QUOTED_BODY = String.raw`[\[{](?:[^']|${SHELL_APOSTROPHES})*(?:'${SHELL_WORD_END}|(?![\s\S]))`

const isJsonBody = (body: string, closed: boolean): boolean => {
  // Highlight a JSON-shaped argument as it is being typed. Once the quote
  // closes, require one JSON value so bracketed text keeps its string scope.
  if (!closed) {
    return true
  }

  try {
    JSON.parse(body.replace(APOSTROPHE_ESCAPE, "'"))
    return true
  } catch {
    return false
  }
}

const curl: Grammar = {
  name: 'curl',
  states: {
    root: {
      // Flags are case-sensitive: `-d` sends a body and `-D` names a file to
      // dump headers into, `-F` sends a form and `-f` fails on HTTP errors.
      rules: [
        shellContinuation,

        // curl itself does not care about the case of a method, and neither did
        // the grammar this replaces, so the command and the method are matched
        // in any case.
        { match: '\\b[cC][uU][rR][lL]\\b', scope: 'keyword' },
        { match: '(^|\\s)(--request|-X)(?=\\s)', push: 'method' },

        { match: String.raw`(^|\s)-[${SHORT_SWITCHES}]*d(?![\w-])`, push: 'data' },
        {
          // curl allows = before an attached value on long options only.
          match: String.raw`(^|\s)(?:${LONG_DATA_FLAGS})(?:=(?=(?:${SHELL_CONTINUATION})*')|${SHELL_WORD_END})`,
          push: 'data',
        },

        // Anchored to a boundary so the hyphens inside a URL or a header name
        // are not mistaken for flags. Consume dotted names and numeric
        // switches whole so `--http1.1` and `-4` stay unscoped.
        { match: '(^|\\s)--[A-Za-z][\\w.-]*' },
        { match: String.raw`(^|\s)-[${SHORT_SWITCHES}]+${SHELL_WORD_END}` },
        { match: '(^|\\s)-[A-Za-z](?![\\w-])' },

        shellEscape,
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

    // Only a single-quoted object or array candidate can use the JSON grammar.
    data: {
      rules: [
        shellContinuation,
        { match: '\\s+' },
        {
          match: String.raw`'(?=\s*${QUOTED_BODY})`,
          scope: 'string',
          set: 'json-quoted',
        },
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
      // the body. Mask them so JSON can apply one scope to the whole key or
      // string. snippetz writes the first form and shell examples use both.
      embed: { language: 'json', until: "'", holes: SHELL_APOSTROPHES, preserveHoleScope: true, accept: isJsonBody },
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
