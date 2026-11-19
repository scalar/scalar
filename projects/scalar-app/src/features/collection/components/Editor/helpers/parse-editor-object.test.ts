import { describe, expect, it } from 'vitest'

import { parseEditorObject } from './parse-editor-object'

describe('parse-editor-object', () => {
  it('parses YAML with many aliases in the collection editor', () => {
    const document = [
      'shared: &shared value',
      ...Array.from({ length: 200 }, (_, index) => `item${index}: *shared`),
    ].join('\n')

    expect(parseEditorObject(document, 'yaml')?.item199).toBe('value')
  })

  it('returns null for excessive YAML alias expansion', () => {
    const document = [
      'l0: &l0 value',
      ...Array.from(
        { length: 5 },
        (_, index) => `l${index + 1}: &l${index + 1} [${Array(10).fill(`*l${index}`).join(', ')}]`,
      ),
    ].join('\n')

    expect(parseEditorObject(document, 'yaml')).toBeNull()
  })
})
