import type { Rule } from '../../core/types'

const SHELL_NEWLINE = String.raw`\r?\n`

/** The shell removes a backslash followed by a newline before splitting words. */
export const SHELL_LINE_SPLICE = String.raw`\\${SHELL_NEWLINE}`

/** Continuations disappear before the shell looks for word boundaries. */
export const SHELL_SPLICES = `(?:${SHELL_LINE_SPLICE})*`

// A separator must follow an even number of backslashes, including zero.
const UNESCAPED_WHITESPACE = String.raw`(?<!\\)(?:\\\\)*(?:[ \t]|\r\n|(?<!\r)\n)`

/** The start of a snippet or a position after unescaped whitespace. */
export const SHELL_WORD_START = String.raw`(?<=(?:(?<![\s\S])|${UNESCAPED_WHITESPACE})${SHELL_SPLICES})`

/** A line-ending backslash joins shell lines, so it reads as punctuation. */
export const shellContinuation: Rule = {
  match: String.raw`(\\)(?:${SHELL_NEWLINE}|(?![\s\S]))`,
  scope: ['punctuation'],
}

/**
 * Consume an escaped character before interpreting quotes. In `'it'\''s'`,
 * the escaped apostrophe is literal and the following quote reopens the string.
 */
export const shellEscape: Rule = { match: '\\\\[^\\r\\n]', scope: 'string.escape' }
