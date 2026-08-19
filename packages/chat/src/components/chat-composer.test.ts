import { MAX_PROMPT_SIZE } from '@scalar/chat-protocol/limits'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import { CHAT_COPY_KEY, mergeChatCopy } from '@/copy/copy'

import ChatComposer from './ChatComposer.vue'

/** Dispatch a real keydown so read-only event fields like isComposing hold. */
const pressEnter = (element: Element, init: KeyboardEventInit = {}): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
    ...init,
  })

  element.dispatchEvent(event)
  return event
}

describe('chat-composer', () => {
  it('submits the trimmed draft on Enter and leaves the model untouched', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '  hello there  ', streaming: false },
    })

    const event = pressEnter(wrapper.get('textarea').element)
    await nextTick()

    expect(wrapper.emitted('submit')).toEqual([['hello there']])
    // Clearing is the shell's call — the composer must not touch the model.
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(event.defaultPrevented).toBe(true)
  })

  it('lets Shift+Enter insert a newline instead of submitting', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'line one', streaming: false },
    })

    const event = pressEnter(wrapper.get('textarea').element, {
      shiftKey: true,
    })
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores an Enter that only commits an IME composition', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'こんにちは', streaming: false },
    })

    const event = pressEnter(wrapper.get('textarea').element, {
      isComposing: true,
    })
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores the WebKit-shaped IME commit Enter (keyCode 229, isComposing false)', async () => {
    // Safari fires compositionend before the confirming keydown, so the
    // Enter arrives with isComposing false and keyCode 229.
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'こんにちは', streaming: false },
    })

    const event = pressEnter(wrapper.get('textarea').element, {
      isComposing: false,
      keyCode: 229,
    })
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(event.defaultPrevented).toBe(false)
  })

  it('treats Enter mid-stream as a pulse, not a submit or interrupt', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'queued thought', streaming: true },
    })

    pressEnter(wrapper.get('textarea').element)
    await flushPromises()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('stop')).toBeUndefined()
    // The typed text survives and the send control plays its attention pulse.
    expect(wrapper.get('textarea').element.value).toBe('queued thought')
    expect(wrapper.get('button').classes()).toContain('chat-send-pulse')
  })

  it('does not submit an empty or whitespace-only draft', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '   ', streaming: false },
    })

    pressEnter(wrapper.get('textarea').element)
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('holds back drafts over the protocol limit', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        modelValue: 'a'.repeat(MAX_PROMPT_SIZE + 1),
        streaming: false,
      },
    })

    expect(wrapper.attributes('data-over-limit')).toBe('true')
    expect((wrapper.vm as unknown as { overLimit: boolean }).overLimit).toBe(true)
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()

    pressEnter(wrapper.get('textarea').element)
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('clears the over-limit state at exactly the protocol limit', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'a'.repeat(MAX_PROMPT_SIZE), streaming: false },
    })

    expect(wrapper.attributes('data-over-limit')).toBeUndefined()
    expect((wrapper.vm as unknown as { overLimit: boolean }).overLimit).toBe(false)
  })

  it('gates submission behind sendDisabled', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'ready', streaming: false, sendDisabled: true },
    })

    pressEnter(wrapper.get('textarea').element)
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits the model update as the user types', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
    })

    await wrapper.get('textarea').setValue('typing')

    expect(wrapper.emitted('update:modelValue')).toEqual([['typing']])
  })

  it('applies the stacked layout by default and inline on request', () => {
    const stacked = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
    })
    const inline = mount(ChatComposer, {
      props: { modelValue: '', streaming: false, layout: 'inline' },
    })

    expect(stacked.classes()).toContain('chat-composer-stacked')
    expect(inline.classes()).toContain('chat-composer-inline')
    expect(inline.classes()).not.toContain('chat-composer-stacked')
  })

  it('forwards stop from the send control while streaming', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: true },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('shows the default disclaimer footnote from the copy dictionary', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
    })

    expect(wrapper.get('.chat-composer-footnote').text()).toBe('AI-generated — verify important details')
  })

  it('renders no footnote when the disclaimer copy is cleared', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
      global: {
        provide: {
          [CHAT_COPY_KEY as symbol]: mergeChatCopy({
            disclaimer: { short: '' },
          }),
        },
      },
    })

    expect(wrapper.find('.chat-composer-footnote').exists()).toBe(false)
  })

  it('places the banners dock after the input so Tab reaches its buttons from the textarea', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
      slots: { banners: () => h('div', { class: 'probe-banner' }, 'banner') },
    })

    const banners = wrapper.get('.chat-composer-banners').element
    const input = wrapper.get('.chat-composer-input').element

    expect(wrapper.find('.probe-banner').exists()).toBe(true)
    // Tab order follows the DOM: the dock must come after the input block.
    expect(input.compareDocumentPosition(banners) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('returns focus to the textarea after streaming ends', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: true },
      attachTo: document.body,
    })

    await wrapper.setProps({ streaming: false })
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.get('textarea').element)
    wrapper.unmount()
  })

  it('does not steal focus from outside the composer when streaming ends', async () => {
    // A rail chat renders next to unrelated inputs; a stream completing must
    // not interrupt the user typing in one of them.
    const outside = document.createElement('input')
    document.body.appendChild(outside)

    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: true },
      attachTo: document.body,
    })

    outside.focus()
    await wrapper.setProps({ streaming: false })
    await flushPromises()

    expect(document.activeElement).toBe(outside)
    wrapper.unmount()
    outside.remove()
  })

  it('reclaims focus when it sits inside the composer when streaming ends', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: true },
      attachTo: document.body,
    })

    // The user just clicked the Stop control inside the composer.
    ;(wrapper.get('.chat-send').element as HTMLButtonElement).focus()
    await wrapper.setProps({ streaming: false })
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.get('textarea').element)
    wrapper.unmount()
  })

  it('submits an empty draft when allowEmptySubmit is set', async () => {
    // Shells whose message can be attachment-only (the editor) opt in.
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false, allowEmptySubmit: true },
    })

    await wrapper.get('.chat-send').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['']])
  })

  it('still blocks an empty draft without allowEmptySubmit', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '   ', streaming: false },
    })

    await wrapper.get('.chat-send').trigger('click')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('submits an empty draft via Enter when allowEmptySubmit is set', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false, allowEmptySubmit: true },
    })

    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toEqual([['']])
  })

  it('forwards maxlength to the native textarea', () => {
    // The native attribute is the composition-safe cap; shells must never
    // clamp the model programmatically instead.
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false, maxlength: 5000 },
    })

    expect(wrapper.get('textarea').attributes('maxlength')).toBe('5000')
  })

  it('omits maxlength when the prop is not set', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
    })

    expect(wrapper.get('textarea').attributes('maxlength')).toBeUndefined()
  })

  it('renders inputStart slot content inside the input box before the field', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
      slots: { inputStart: () => h('div', { class: 'probe-attachments' }) },
    })

    const input = wrapper.get('.chat-composer-input').element
    const probe = wrapper.get('.probe-attachments').element
    const field = wrapper.get('textarea').element

    expect(input.contains(probe)).toBe(true)
    // The strip docks above the field: it must precede it in the DOM.
    expect(probe.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('uses the copy dictionary for the placeholder', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '', streaming: false },
      global: {
        provide: {
          [CHAT_COPY_KEY as symbol]: mergeChatCopy({
            composer: { placeholder: 'Ask about this API' },
          }),
        },
      },
    })

    expect(wrapper.get('textarea').attributes('placeholder')).toBe('Ask about this API')
  })
})
