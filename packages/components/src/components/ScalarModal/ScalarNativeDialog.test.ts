import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ScalarNativeDialog from './ScalarNativeDialog.vue'

const prototype = HTMLDialogElement.prototype
const originalShowModal = Object.getOwnPropertyDescriptor(prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(prototype, 'close')
let originalOverflow = ''
let originalPriority = ''

describe('ScalarNativeDialog', () => {
  beforeEach(() => {
    originalOverflow = document.documentElement.style.getPropertyValue('overflow')
    originalPriority = document.documentElement.style.getPropertyPriority('overflow')
    // jsdom does not implement the native dialog API; browser tests cover its focus and top-layer behavior.
    Object.defineProperties(prototype, {
      showModal: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.open = true
        },
      },
      close: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.open = false
          this.dispatchEvent(new Event('close'))
        },
      },
    })
  })

  afterEach(() => {
    if (originalShowModal) Object.defineProperty(prototype, 'showModal', originalShowModal)
    else Reflect.deleteProperty(prototype, 'showModal')
    if (originalClose) Object.defineProperty(prototype, 'close', originalClose)
    else Reflect.deleteProperty(prototype, 'close')
    if (originalOverflow) document.documentElement.style.setProperty('overflow', originalOverflow, originalPriority)
    else document.documentElement.style.removeProperty('overflow')
  })

  it('keeps scrolling locked until the last dialog closes or unmounts', async () => {
    document.documentElement.style.setProperty('overflow', 'auto')
    const first = mount(ScalarNativeDialog, { props: { open: true } })
    const second = mount(ScalarNativeDialog, { props: { open: true } })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')
    await first.setProps({ open: false })
    expect(document.documentElement.style.overflow).toBe('hidden')
    second.unmount()
    expect(document.documentElement.style.overflow).toBe('auto')
    first.unmount()
  })

  it('preserves editor content when unmount is disabled', async () => {
    const wrapper = mount(ScalarNativeDialog, {
      props: { open: true, unmount: false },
      slots: { default: '<input aria-label="Draft" />' },
    })
    await wrapper.get('input').setValue('Unsaved request')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.get('input').element.value).toBe('Unsaved request')
    wrapper.unmount()
  })

  it('unmounts closed content by default', async () => {
    const wrapper = mount(ScalarNativeDialog, {
      props: { open: true },
      slots: { default: '<input aria-label="Draft" />' },
    })
    await wrapper.get('input').setValue('Temporary content')
    await wrapper.setProps({ open: false })
    expect(wrapper.find('input').exists()).toBe(false)
    await wrapper.setProps({ open: true })
    expect(wrapper.get('input').element.value).toBe('')
    wrapper.unmount()
  })

  it('requests dismissal on Escape without accepting a stale close event after reopening', async () => {
    const wrapper = mount(ScalarNativeDialog, { props: { open: true } })
    await nextTick()
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    wrapper.get('dialog').element.dispatchEvent(new Event('close'))
    expect(wrapper.emitted('close')).toBeUndefined()
    const cancel = new Event('cancel', { cancelable: true })
    wrapper.get('dialog').element.dispatchEvent(cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(wrapper.emitted('close')).toEqual([[]])
    wrapper.unmount()
  })
})
