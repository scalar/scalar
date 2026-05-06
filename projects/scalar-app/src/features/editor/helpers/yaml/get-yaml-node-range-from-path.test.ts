import { describe, expect, it } from 'vitest'

import { getYamlNodeRangeFromPath } from './get-yaml-node-range-from-path'

describe('get-yaml-node-range-from-path', () => {
  it('returns null when the path does not exist', () => {
    const yamlText = 'a: 1\n'
    expect(getYamlNodeRangeFromPath(yamlText, ['missing'])).toBeNull()
  })

  it('returns offsets for a nested scalar value', () => {
    const yamlText = ['openapi: 3.1.0', 'paths:', '  /pets:', '    get:', '      summary: List'].join('\n')

    const range = getYamlNodeRangeFromPath(yamlText, ['paths', '/pets', 'get', 'summary'])

    expect(range).not.toBeNull()
    expect(yamlText.slice(range!.startOffset, range!.startOffset + 7)).toBe('summary')
    expect(range!.endOffset).toBeGreaterThan(range!.startOffset)
  })

  it('returns offsets for values inside sequences', () => {
    const yamlText = ['paths:', '  /pets:', '    get:', '      servers:', '        - url: https://example.com'].join(
      '\n',
    )

    const range = getYamlNodeRangeFromPath(yamlText, ['paths', '/pets', 'get', 'servers', 0, 'url'])

    expect(range).not.toBeNull()
    expect(yamlText.slice(range!.startOffset, range!.startOffset + 3)).toBe('url')
    expect(range!.endOffset).toBeGreaterThan(range!.startOffset)
  })
})
