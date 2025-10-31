import { EditorState, EditorView } from '@scalar/use-codemirror'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { beforeEach, describe, expect, it } from 'vitest'

import { pillPlugin } from './code-variable-widget'

describe('code-variable-widget', () => {
  let container: HTMLElement
  let environment: XScalarEnvironment

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    environment = {
      color: '#ff0000',
      variables: [
        {
          name: 'testVar',
          value: 'test value',
        },
        {
          name: 'apiKey',
          value: 'secret123',
        },
      ],
    }
  })

  it('creates decorations for variables on a single line', () => {
    const doc = '{{testVar}}'
    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment, isReadOnly: false })],
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    // The view should render without errors
    expect(view.state.doc.toString()).toBe(doc)

    view.destroy()
  })

  it('handles multiple variables on the same line', () => {
    const doc = '{{testVar}} and {{apiKey}}'
    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment, isReadOnly: false })],
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    expect(view.state.doc.toString()).toBe(doc)

    view.destroy()
  })

  it('does not create decorations for variables that span line breaks', () => {
    // This is the key test case that would previously cause the error:
    // "Decorations that replace line breaks may not be specified via plugins"
    const doc = '{{test\nVar}}'
    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment, isReadOnly: false })],
    })

    // This should not throw an error
    expect(() => {
      const view = new EditorView({
        state,
        parent: container,
      })

      // Document should remain unchanged
      expect(view.state.doc.toString()).toBe(doc)

      view.destroy()
    }).not.toThrow()
  })

  it('handles variables before and after line breaks correctly', () => {
    const doc = '{{testVar}}\n{{apiKey}}'
    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment, isReadOnly: false })],
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    expect(view.state.doc.toString()).toBe(doc)

    view.destroy()
  })

  it('works with empty environment', () => {
    const doc = '{{testVar}}'
    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment: undefined, isReadOnly: false })],
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    expect(view.state.doc.toString()).toBe(doc)

    view.destroy()
  })

  it('works in read-only mode', () => {
    const doc = '{{testVar}}'
    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment, isReadOnly: true })],
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    expect(view.state.doc.toString()).toBe(doc)

    view.destroy()
  })

  it('handles complex multiline scenarios without errors', () => {
    // Complex scenario with mix of valid and invalid (multiline) variables
    const doc = `{{validVar}}
Some text
{{another
Variable}}
{{validVar2}}`

    const state = EditorState.create({
      doc,
      extensions: [pillPlugin({ environment, isReadOnly: false })],
    })

    // This should not throw the line break decoration error
    expect(() => {
      const view = new EditorView({
        state,
        parent: container,
      })

      expect(view.state.doc.toString()).toBe(doc)

      view.destroy()
    }).not.toThrow()
  })

  it('handles text input that causes line breaks', () => {
    const initialDoc = '{{testVar}}'
    const state = EditorState.create({
      doc: initialDoc,
      extensions: [pillPlugin({ environment, isReadOnly: false })],
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    // Simulate user typing in the middle of a variable to create a line break
    const transaction = view.state.update({
      changes: { from: 6, to: 6, insert: '\n' },
    })

    // This should not throw an error
    expect(() => {
      view.dispatch(transaction)
    }).not.toThrow()

    expect(view.state.doc.toString()).toBe('{{test\nVar}}')

    view.destroy()
  })
})
