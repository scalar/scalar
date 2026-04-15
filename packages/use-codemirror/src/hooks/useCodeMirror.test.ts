// @vitest-environment jsdom
import { EditorView } from '@codemirror/view'
import { beforeAll, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { preloadCodeMirror, useCodeMirror } from '../hooks/useCodeMirror'

/**
 * Eagerly load the CodeMirror setup module so that the dynamic import inside
 * useCodeMirror resolves from cache during tests.
 */
beforeAll(async () => {
  await preloadCodeMirror()
})

describe('useCodeMirror', () => {
  it('should initialize with basic configuration', async () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: '',
      language: undefined,
    })
    await Promise.resolve()
    expect(codeMirror.value).not.toBeNull()
  })

  it('should update content when content prop changes', async () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror, setCodeMirrorContent } = useCodeMirror({
      codeMirrorRef,
      content: 'initial',
      language: undefined,
    })
    await Promise.resolve()

    setCodeMirrorContent('updated content')
    expect(codeMirror.value?.state.doc.toString()).toBe('updated content')
  })

  it('should handle read-only mode', async () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: 'test content',
      language: undefined,
      readOnly: true,
    })
    await Promise.resolve()

    expect(codeMirror.value?.state.facet(EditorView.editable)).toBe(false)
  })

  it('should support different languages', async () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: '{"test": "json"}',
      language: 'json',
    })
    await Promise.resolve()

    expect(codeMirror.value).not.toBeNull()
  })

  it('should trigger onChange callback', async () => {
    let changedContent = ''
    const codeMirrorRef = ref(document.createElement('div'))
    const { setCodeMirrorContent } = useCodeMirror({
      codeMirrorRef,
      content: 'initial',
      language: undefined,
      onChange: (content) => {
        changedContent = content
      },
    })
    await Promise.resolve()

    setCodeMirrorContent('new content')
    expect(changedContent).toBe('new content')
  })

  it('should handle placeholder text', async () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: '',
      language: undefined,
      placeholder: 'Type something...',
    })
    await Promise.resolve()

    expect(codeMirror.value).not.toBeNull()
    expect(codeMirror.value!.dom.querySelector('.cm-placeholder')).not.toBeNull()
  })
})
