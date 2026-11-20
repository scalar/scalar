import type { Rule } from '../../core/types'

const SHELL_NEWLINE = String.raw`\r?\n`

/** The shell removes a backslash followed by a newline before splitting words. */
export const SHELL_LINE_SPLICE = String.raw`\\${SHELL_NEWLINE}`

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
