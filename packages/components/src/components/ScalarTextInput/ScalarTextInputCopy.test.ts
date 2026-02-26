import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ScalarCopyButton from '../ScalarCopy/ScalarCopyButton.vue'
import ScalarTextInput from './ScalarTextInput.vue'
import ScalarTextInputCopy from './ScalarTextInputCopy.vue'

const mockWriteText = vi.fn().mockResolvedValue(undefined)
const mockExecCommand = vi.fn().mockReturnValue(true)

describe('ScalarTextInputCopy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders ScalarTextInput with copy button in aside', () => {
    const wrapper = mount(ScalarTextInputCopy, {
      props: {
        modelValue: 'hello',
      },
    })

    expect(wrapper.findComponent(ScalarTextInput).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarCopyButton).exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('passes readonly as inverse of editable', () => {
    const wrapperEditable = mount(ScalarTextInputCopy, {
      props: {
        modelValue: '',
        editable: true,
      },
    })
    const wrapperReadonly = mount(ScalarTextInputCopy, {
      props: {
        modelValue: '',
        editable: false,
      },
    })

    expect(wrapperEditable.findComponent(ScalarTextInput).props('readonly')).toBe(false)
    expect(wrapperReadonly.findComponent(ScalarTextInput).props('readonly')).toBe(true)
  })

  it('copies on mount when immediate is true and model has value', async () => {
    const wrapper = mount(ScalarTextInputCopy, {
      props: {
        modelValue: 'copy me now',
        immediate: true,
      },
    })

    await flushPromises()

    const copyButton = wrapper.findComponent(ScalarCopyButton)
    expect(copyButton.props('copied')).toBe(true)
  })

  it('does not copy on mount when immediate is false', async () => {
    const wrapper = mount(ScalarTextInputCopy, {
      props: {
        modelValue: 'do not copy',
        immediate: false,
      },
    })

    await flushPromises()

    expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(false)
  })

  it('copy button click copies current model value', async () => {
    const wrapper = mount(ScalarTextInputCopy, {
      props: {
        modelValue: 'value to copy',
      },
    })

    await wrapper.findComponent(ScalarCopyButton).trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(true)
  })

  it('passes copy slot to ScalarCopyButton', () => {
    const wrapper = mount(ScalarTextInputCopy, {
      props: { modelValue: 'x' },
      slots: { copy: 'Copy label' },
    })

    expect(wrapper.findComponent(ScalarCopyButton).text()).toContain('Copy label')
  })
})
