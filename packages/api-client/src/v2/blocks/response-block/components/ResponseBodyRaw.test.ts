import { EditorView } from '@scalar/use-codemirror'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ResponseBodyRaw from './ResponseBodyRaw.vue'

describe('ResponseBodyRaw', () => {
  it('toggles response wrapping without losing keyboard focus or changing content', async () => {
    const wrapper = mount(ResponseBodyRaw, {
      attachTo: document.body,
      props: { content: 'long response body', language: undefined },
    })
    await nextTick()
    const button = wrapper.get<HTMLButtonElement>('button[aria-label="Wrap lines"]')
    const editor = EditorView.findFromDOM(wrapper.get<HTMLElement>('.cm-editor').element)
    button.element.focus()

    await button.trigger('click')

    expect(document.activeElement).toBe(button.element)
    expect(button.attributes('aria-pressed')).toBe('true')
    await vi.waitFor(() => expect(editor?.contentDOM.classList.contains('cm-lineWrapping')).toBe(true))
    expect(editor?.state.doc.toString()).toBe('long response body')

    await button.trigger('click')

    expect(document.activeElement).toBe(button.element)
    expect(button.attributes('aria-pressed')).toBe('false')
    await vi.waitFor(() => expect(editor?.contentDOM.classList.contains('cm-lineWrapping')).toBe(false))
    wrapper.unmount()
  })
})
