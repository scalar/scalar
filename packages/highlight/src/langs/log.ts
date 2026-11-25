import type { Grammar } from '../core/types'

/** Familiar labels, without one-letter abbreviations that often mean something else. */
const LEVEL = 'TRACE|DEBUG|VERBOSE|INFO|INFORMATION|NOTICE|WARN|WARNING|ERROR|FATAL|CRITICAL|ALERT|EMERG|EMERGENCY'
const CASE_INSENSITIVE_LEVEL = LEVEL.replace(/[A-Z]/g, (letter) => `[${letter}${letter.toLowerCase()}]`)
const FIELD_END = '[ \\t\\r\\n\\u2028\\u2029]|$'
const LEVEL_END = `(?=:|${FIELD_END})`

const TIME = '\\d{2}:\\d{2}:\\d{2}(?:[.,]\\d+)?(?:[ \\t]?(?:Z|UTC|GMT|[+-]\\d{2}(?::?\\d{2})?))?'
const MONTH = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
const DATE = `(?:\\d{4}[-/.]\\d{2}[-/.]\\d{2}|\\d{2}[-/.]\\d{2}[-/.]\\d{4}|\\d{2}[ -]${MONTH}[ -]\\d{4})`

const TIMESTAMP = `(?:${DATE})(?:[T \\t]${TIME})?|${MONTH}[ \\t]+\\d{1,2}[ \\t]+${TIME}|\\d{8}T\\d{6}(?:[.,]\\d+)?(?:Z|[+-]\\d{2}(?::?\\d{2})?)?|${TIME}`

// Treat non-ASCII, non-whitespace characters as part of a word so the
// ASCII patterns cannot start halfway through one.
const WORD_CHARACTER = '\\w|[^\\x00-\\x7F\\s]'
// A leading number or timestamp can also be part of an IP address or version.
const NUMBER_END = `(?!${WORD_CHARACTER}|\\.\\d|:[\\da-fA-F:]|[+-][\\w-])`
const EXCEPTION_NAME = '(?:[A-Za-z_$][\\w$]*\\.)*(?:[A-Z][\\w$]*(?:Exception|Error)|Exception|Error(?=:))'

/**
 * Human-readable logs, rather than a parser for a particular layout.
 *
 * Header fields may appear in any order. The first unrecognized text (or a
 * message separator) ends the header, so severity words inside a message do
 * not become keywords. Only uppercase bare levels are accepted; brackets or
 * a colon make other casing sufficiently unambiguous. Each line starts fresh.
 */
const log: Grammar = {
  name: 'log',
  states: {
    root: {
      rules: [
        { match: `\\[[ \\t]*(?:${CASE_INSENSITIVE_LEVEL})[ \\t]*\\]`, scope: 'keyword', set: 'after-level' },
        {
          match: `\\b(?:${CASE_INSENSITIVE_LEVEL}):(?=${FIELD_END})`,
          scope: 'keyword',
          set: 'message',
        },
        { match: `\\b(?:${LEVEL})${LEVEL_END}`, scope: 'keyword', set: 'after-level' },
        { include: 'header' },
      ],
    },
    'after-level': {
      rules: [
        // A second level is message text, even if it is bracketed like context.
        {
          match: `(?=\\[[ \\t]*(?:${CASE_INSENSITIVE_LEVEL})[ \\t]*\\]|\\b(?:${CASE_INSENSITIVE_LEVEL})${LEVEL_END})`,
          set: 'message',
        },
        { include: 'header' },
      ],
    },
    header: {
      rules: [
        { include: 'exceptions' },
        { match: /[ \t]+/ },
        { match: /\r\n|[\r\n\u2028\u2029]/, set: 'root' },
        { match: `(\\[)((?:${TIMESTAMP}))(\\])`, scope: [null, 'number', null] },
        { match: `\\b(?:${TIMESTAMP})${NUMBER_END}`, scope: 'number' },
        // Bracketed context is deliberately bounded: malformed prefixes must
        // not rescan a long line for a closing bracket at every opening one.
        { match: /\[[^\s[\]]{1,128}\]/, scope: 'namespace' },
        { match: `\\b\\d+${NUMBER_END}`, scope: 'number' },
        // Only qualified logger names can precede a level without a delimiter:
        // accepting any word here would turn "No ERROR occurred" into a header.
        {
          match: /([A-Za-z_$][\w.$/-]*)(\[)(\d+)(\])(:)/,
          scope: ['namespace', 'punctuation.bracket', 'number', 'punctuation.bracket', 'punctuation.delimiter'],
        },
        { match: `[A-Za-z_$][\\w.$/-]*:(?=${FIELD_END})`, scope: 'namespace' },
        {
          match: `[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)+(?=[ \\t]+(?:\\[|\\d|(?:${CASE_INSENSITIVE_LEVEL})${LEVEL_END}))`,
          scope: 'namespace',
        },
        {
          match: `[A-Za-z_$][\\w.$/-]*(?=[ \\t]+[-|](?=${FIELD_END}))`,
          scope: 'namespace',
        },
        { match: `[-|](?=${FIELD_END})`, set: 'message' },
        // Zero width keeps the first character available to strings, URLs and
        // exception rules in the message state.
        { match: /(?=\S)/, set: 'message' },
      ],
    },
    exceptions: {
      rules: [
        {
          match:
            /^([ \t]+at[ \t]+)([^\s()]+)([ \t]*\()([^()\r\n\u2028\u2029]*:\d+(?::\d+)?|Native Method|Unknown Source|<anonymous>)(\))/,
          scope: ['keyword.control', 'function.call', null, 'link', null],
          set: 'message',
        },
        {
          match: `^([ \\t]+at[ \\t]+)([^\\s()]+:\\d+(?::\\d+)?)(?=${FIELD_END})`,
          scope: ['keyword.control', 'link'],
          set: 'message',
        },
        { match: /^[ \t]*(?:Caused by:|Suppressed:)/, scope: 'keyword.control', set: 'message' },
        {
          match: `(?<![.$]|${WORD_CHARACTER})${EXCEPTION_NAME}(?!\\.?(?:\\$|${WORD_CHARACTER}))`,
          scope: 'type',
          set: 'message',
        },
      ],
    },
    message: {
      rules: [
        { include: 'exceptions' },
        { match: /\r\n|[\r\n\u2028\u2029]/, set: 'root' },
        { match: /\b(?:https?|ftp|file):\/\/[^\s<>"']+/, scope: 'link' },
        { match: /"/, scope: 'string', push: 'double-quoted' },
        { match: `(?<!${WORD_CHARACTER})'`, scope: 'string', push: 'single-quoted' },
      ],
    },
    'double-quoted': {
      default: 'string',
      rules: [
        { match: /\\[^\r\n\u2028\u2029]/, scope: 'string.escape' },
        { match: /"/, scope: 'string', pop: true },
        { match: /(?=[\r\n\u2028\u2029])/, pop: true, set: 'root' },
      ],
    },
    'single-quoted': {
      default: 'string',
      rules: [
        { match: /\\[^\r\n\u2028\u2029]/, scope: 'string.escape' },
        { match: /'/, scope: 'string', pop: true },
        { match: /(?=[\r\n\u2028\u2029])/, pop: true, set: 'root' },
      ],
    },
  },
}

export default log
