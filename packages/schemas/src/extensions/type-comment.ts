const TYPE_COMMENT_FENCE = '```'

/**
 * Fenced code block for typeComment strings (used by type generation for JSDoc).
 * Example bodies are passed through as-is so backticks and `${...}` appear literally in docs.
 */
export const typeCommentCodeBlock = (language: string, body: string): string =>
  `${TYPE_COMMENT_FENCE}${language}\n${body.trimEnd()}\n${TYPE_COMMENT_FENCE}`

/** `@example` section with a fenced code block for typeComment. */
export const typeCommentExample = (language: string, body: string): string =>
  `@example\n${typeCommentCodeBlock(language, body)}`

/** Inline code span for typeComment strings (for example `` `enum` ``). */
export const typeCommentInlineCode = (text: string): string => `\`${text}\``

/** Join typeComment sections with a blank line between each. */
export const typeCommentSections = (...sections: string[]): string => sections.join('\n\n')

/** Description plus an `@example` fenced code block for typeComment. */
export const typeCommentWithExample = (description: string, example: { language: string; body: string }): string =>
  typeCommentSections(description, typeCommentExample(example.language, example.body))
