// @vitest-environment jsdom
import { history, undo } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { afterEach, describe, expect, it } from 'vitest'

import { colorPicker } from './color-picker'

const editors: EditorView[] = []

const createEditor = (doc: string, language: Extension = css()): EditorView => {
  const editor = new EditorView({
    state: EditorState.create({ doc, extensions: [language, history(), colorPicker] }),
    parent: document.body,
  })
  editors.push(editor)
  return editor
}

const changeColor = (editor: EditorView, value: string): void => {
  const input = editor.dom.querySelector('input')
  expect(input?.type).toBe('color')
  if (!input) {
    throw new Error('Expected a color input')
  }
  input.value = value
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

afterEach(() => {
  for (const editor of editors.splice(0)) {
    editor.destroy()
    editor.dom.remove()
  }
})

describe('color-picker', () => {
  it.each([
    ['#f00', '#ff0000'],
    ['#ff000080', '#ff0000'],
    ['#f008', '#ff0000'],
    ['red', '#ff0000'],
    ['rgb(255, 0, 0)', '#ff0000'],
    ['rgb(100% 0% 0% / 50%)', '#ff0000'],
    ['hsl(0, 100%, 50%)', '#ff0000'],
  ])('renders a swatch for %s', (value, expected) => {
    const editor = createEditor(`a { color: ${value}; }`)
    expect(Array.from(editor.dom.querySelectorAll('input'), (input) => input.value)).toStrictEqual([expected])
  })

  it.each([
    ['#ff000080', '#00ff0080'],
    ['#f008', '#00ff0088'],
    ['rgba(255, 0, 0, 0.5)', 'rgb(0, 255, 0, 0.5)'],
    ['hsl(0, 100%, 50%)', 'hsl(120, 100%, 50%)'],
    ['red', 'lime'],
  ])('preserves the existing edit format for %s', (value, expected) => {
    const editor = createEditor(`a { color: ${value}; }`)
    changeColor(editor, '#00ff00')
    expect(editor.state.doc.toString()).toBe(`a { color: ${expected}; }`)
    expect(undo(editor)).toBe(true)
    expect(editor.state.doc.toString()).toBe(`a { color: ${value}; }`)
  })

  it.each(['<style>a { color: #ff0000; }</style>', '<div style="color: #ff0000">example</div>'])(
    'edits CSS embedded in HTML: %s',
    (doc) => {
      const editor = createEditor(doc, html())
      changeColor(editor, '#00ff00')
      expect(editor.state.doc.toString()).toBe(doc.replace('#ff0000', '#00ff00'))
    },
  )

  it('does not create swatches for comments or unrelated HTML attributes', () => {
    const editor = createEditor('<div title="#ff0000">red</div><style>/* color: red */</style>', html())
    expect(editor.dom.querySelector('input')).toBeNull()
  })

  it('updates edit positions after the document changes', () => {
    const editor = createEditor('a { color: #ff0000; }')
    editor.dispatch({ changes: { from: 0, insert: '/* prefix */ ' } })
    changeColor(editor, '#00ff00')
    expect(editor.state.doc.toString()).toBe('/* prefix */ a { color: #00ff00; }')
  })
})
