// @vitest-environment jsdom
import { EditorView } from '@codemirror/view'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useCodeMirror } from '../hooks/useCodeMirror'

describe('useCodeMirror', () => {
  it('should initialize with basic configuration', () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: '',
      language: undefined,
    })
    expect(codeMirror.value).not.toBeNull()
  })

  it('should update content when content prop changes', () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror, setCodeMirrorContent } = useCodeMirror({
      codeMirrorRef,
      content: 'initial',
      language: undefined,
    })

    setCodeMirrorContent('updated content')
    expect(codeMirror.value?.state.doc.toString()).toBe('updated content')
  })

  it('should handle read-only mode', () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: 'test content',
      language: undefined,
      readOnly: true,
    })

    expect(codeMirror.value?.state.facet(EditorView.editable)).toBe(false)
  })

  it('should support different languages', () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: '{"test": "json"}',
      language: 'json',
    })

    expect(codeMirror.value).not.toBeNull()
  })

  it('should trigger onChange callback', () => {
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

    setCodeMirrorContent('new content')
    expect(changedContent).toBe('new content')
  })

  it('should handle placeholder text', () => {
    const codeMirrorRef = ref(document.createElement('div'))
    const { codeMirror } = useCodeMirror({
      codeMirrorRef,
      content: '',
      language: undefined,
      placeholder: 'Type something...',
    })

    expect(codeMirror.value?.dom.querySelector('.cm-placeholder')).not.toBeNull()
  })
})
