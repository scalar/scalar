import { describe, expect, it } from 'vitest'

import { safeUrl } from './markdown-nodes'

describe('markdown-nodes', () => {
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert',
    'java\nscript:alert',
    'data:text/html,payload',
    'file:///etc/passwd',
  ])('neutralizes unsafe URL %s', (url) => {
    expect(safeUrl(url)).toBe('')
  })
  it.each(['https://example.com', 'mailto:hello@example.com', '/relative', '../relative', '#anchor', '//example.com'])(
    'preserves supported URL %s',
    (url) => {
      expect(safeUrl(url)).toBe(url)
    },
  )
})
