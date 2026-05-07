// @vitest-environment jsdom
import { type Extension, StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Ref, nextTick, ref, shallowRef } from 'vue'

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

  describe('performance', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    /** Normalise the `effects` field from a dispatch TransactionSpec — it can be
     * a single StateEffect, an array, or undefined — and check whether any
     * effect is a StateEffect.reconfigure. */
    const hasReconfigure = (args: unknown[]): boolean => {
      const spec = args[0] as { effects?: unknown } | undefined
      if (!spec?.effects) return false
      const effects = Array.isArray(spec.effects) ? spec.effects : [spec.effects]
      return effects.some(
        (e): e is { is: (t: unknown) => boolean } =>
          typeof (e as { is?: unknown }).is === 'function' &&
          (e as { is: (t: unknown) => boolean }).is(StateEffect.reconfigure),
      )
    }

    it('changing content only does not trigger extension reconfiguration', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      const content = ref('initial content')
      const codeMirrorRef = ref(document.createElement('div'))
      useCodeMirror({
        codeMirrorRef,
        content,
        language: undefined,
      })

      // Flush Vue watchers and drain any rAF callbacks scheduled during mount
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      // Count reconfigure dispatches after the initial mount is settled
      const reconfiguresBefore = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // Change only content — extension config fields are untouched
      content.value = 'updated content'
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfiguresAfter = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // A content-only change must not produce any additional reconfigure dispatches
      expect(reconfiguresAfter).toBe(reconfiguresBefore)
    })

    it('mounting with static config does not dispatch StateEffect.reconfigure', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      const codeMirrorRef = ref(document.createElement('div'))
      useCodeMirror({
        codeMirrorRef,
        content: 'static content',
        language: undefined,
      })

      // Flush Vue watchers and drain every rAF (including CodeMirror\'s own
      // internal measure rAF that fires on EditorView construction).
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      // None of the rAF callbacks should have dispatched a StateEffect.reconfigure.
      // Previously the extensions watch ran with { immediate: true }, which queued
      // a redundant reconfigure rAF on every mount. With the watch removed, only
      // meaningful config changes trigger a reconfigure.
      const reconfigureCount = dispatchSpy.mock.calls.filter(hasReconfigure).length
      expect(reconfigureCount).toBe(0)
    })

    it('replacing the extensions ref with a new array identity triggers reconfiguration', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      // A stable extension that will be reused across both array references.
      // Typed explicitly to avoid TS2589 deep instantiation from EditorView.theme.
      const stableExtension: Extension = EditorView.theme({})
      const extensions: Ref<Extension[]> = shallowRef([stableExtension])

      const codeMirrorRef = ref(document.createElement('div'))
      useCodeMirror({
        codeMirrorRef,
        content: 'hello',
        language: undefined,
        extensions,
      })

      // Settle initial mount
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfiguresBefore = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // Replace the array with a new reference (same extension objects inside).
      // useCodeMirror tracks array identity in reconfigureSignal, so this
      // intentionally triggers a reconfigure — it is the caller's responsibility
      // to keep the array reference stable when the contents have not changed.
      // CodeInput does this by using a module-level constant instead of a computed.
      extensions.value = [stableExtension]
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfiguresAfter = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // A new array reference — even with identical contents — triggers one
      // reconfigure. Callers must stabilize their arrays to avoid this cost.
      expect(reconfiguresAfter).toBe(reconfiguresBefore + 1)
    })

    it('reconfigure dispatch is deferred to requestAnimationFrame, not synchronous', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      const language = ref<'json' | 'yaml' | undefined>(undefined)
      const codeMirrorRef = ref(document.createElement('div'))
      useCodeMirror({
        codeMirrorRef,
        content: '{}',
        language,
      })

      // Settle initial mount and drain the rAF it schedules
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfigureCountAfterMount = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // Trigger an extension config change by switching language
      language.value = 'json'
      await nextTick()

      // The dispatch must NOT have fired yet — it is queued inside rAF
      const reconfigureCountSynchronous = dispatchSpy.mock.calls.filter(hasReconfigure).length
      expect(reconfigureCountSynchronous).toBe(reconfigureCountAfterMount)

      // Now manually flush the pending rAF callbacks
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfigureCountAfterRaf = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // After the rAF flushes, exactly one new reconfigure must have been dispatched
      expect(reconfigureCountAfterRaf).toBe(reconfigureCountAfterMount + 1)
    })
  })
})
