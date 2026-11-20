import type { Rule } from '../../core/types'

/** A line-ending backslash joins shell lines, so it reads as punctuation. */
export const shellContinuation: Rule = { match: '\\\\$', scope: 'punctuation' }

/**
 * Consume an escaped character before interpreting quotes. In `'it'\''s'`,
 * the escaped apostrophe is literal and the following quote reopens the string.
 */
export const shellEscape: Rule = { match: '\\\\[^\\r\\n]', scope: 'string.escape' }
