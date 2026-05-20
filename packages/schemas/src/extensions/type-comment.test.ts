import { describe, expect, it } from 'vitest'

import {
  typeCommentCodeBlock,
  typeCommentExample,
  typeCommentInlineCode,
  typeCommentSections,
  typeCommentWithExample,
} from './type-comment'

describe('type-comment', () => {
  it('builds a yaml code fence for JSDoc', () => {
    expect(typeCommentCodeBlock('yaml', 'x-disabled: true')).toBe('```yaml\nx-disabled: true\n```')
  })

  it('preserves backticks and interpolation syntax in example bodies', () => {
    expect(typeCommentCodeBlock('yaml', 'Authorization: `Bearer ${token}`')).toBe(
      '```yaml\nAuthorization: `Bearer ${token}`\n```',
    )
  })

  it('builds an @example section', () => {
    expect(typeCommentExample('yaml', 'x-disabled: true')).toBe('@example\n```yaml\nx-disabled: true\n```')
  })

  it('wraps inline code with backticks', () => {
    expect(typeCommentInlineCode('enum')).toBe('`enum`')
  })

  it('joins sections with blank lines', () => {
    expect(typeCommentSections('First.', 'Second.')).toBe('First.\n\nSecond.')
  })

  it('combines a description and example', () => {
    expect(
      typeCommentWithExample('Display names for enum values.', {
        language: 'yaml',
        body: 'enum: [moon]\nx-enum-varnames: [Moon]',
      }),
    ).toBe('Display names for enum values.\n\n@example\n```yaml\nenum: [moon]\nx-enum-varnames: [Moon]\n```')
  })
})
