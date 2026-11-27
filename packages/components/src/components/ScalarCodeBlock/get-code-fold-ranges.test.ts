import { registerLanguage } from '@scalar/highlight'
import { languages } from '@scalar/highlight/all'
import { describe, expect, it } from 'vitest'

import { getCodeFoldRanges } from './get-code-fold-ranges'

registerLanguage(...languages)

describe('getCodeFoldRanges', () => {
  it('folds nested JSON while ignoring brackets in strings', () => {
    const content = '{\n  "items": [\n    "}"\n  ]\n}'
    expect([...getCodeFoldRanges(content, 'json')]).toStrictEqual([
      [1, 2],
      [0, 3],
    ])
  })

  it('folds CSS rule bodies while ignoring braces in strings and comments', () => {
    const content = 'a {\n  content: "}";\n  /* } */\n}'
    expect([...getCodeFoldRanges(content, 'css')]).toStrictEqual([[0, 2]])
  })

  it('folds a JSON body that ends on the closing bracket line', () => {
    expect([...getCodeFoldRanges('{\n  "item": 42 }', 'json')]).toStrictEqual([[0, 1]])
  })

  it('folds HTML elements and embedded CSS with the closing tags still visible', () => {
    const content = '<DIV>\n<br>\n<style>\na {\n  color: red;\n}\n</style>\n</div>'
    expect([...getCodeFoldRanges(content, 'html')]).toStrictEqual([
      [3, 4],
      [2, 5],
      [0, 6],
    ])
  })

  it('matches case-sensitive XML tags and skips self-closing tags', () => {
    const content = '<root>\n  <child />\n  <CHILD>\nx\n  </CHILD>\n</root>'
    expect([...getCodeFoldRanges(content, 'xml')]).toStrictEqual([
      [2, 3],
      [0, 4],
    ])
  })

  it('folds multiline HTML list items and paragraphs with implied closing tags', () => {
    const content = '<ul>\n<li>\n<p>\n  paragraph\n<div>other</div>\n<li>\n  next\n</ul>'
    expect([...getCodeFoldRanges(content, 'html')]).toStrictEqual([
      [2, 3],
      [1, 4],
      [5, 6],
      [0, 6],
    ])
  })

  it('folds YAML mappings, sequences and block scalars up to the next sibling', () => {
    const content = 'root:\n  items:\n    - one\n    - two\n  value: |\n    first\n    second\nother: true'
    expect([...getCodeFoldRanges(content, 'yaml')]).toStrictEqual([
      [1, 3],
      [4, 6],
      [0, 6],
    ])
  })

  it('keeps unstructured plain text expanded', () => {
    expect([...getCodeFoldRanges('{\n  value\n}', 'plaintext')]).toStrictEqual([])
  })
})
