import { describe, expect, it } from 'vitest'

import { createCodeMirrorTheme } from './createCodeMirrorTheme'

describe('createCodeMirrorTheme', () => {
  it('creates a theme', () => {
    const theme = createCodeMirrorTheme({
      theme: 'light',
      settings: {
        background: '#ffffff',
        foreground: '#000000',
        caret: '#ff0000',
      },
      styles: [],
    })

    expect(theme).toBeInstanceOf(Array)
    expect(theme).toHaveLength(2)
  })
})
