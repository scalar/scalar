import { describe, expect, it } from 'vitest'

import { EditorState, colorPicker, useCodeMirror } from './index'

describe('index', () => {
  it('imports the public API without a browser environment', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof useCodeMirror).toBe('function')
    expect(EditorState.create({ extensions: [colorPicker] }).doc.toString()).toBe('')
  })
})
