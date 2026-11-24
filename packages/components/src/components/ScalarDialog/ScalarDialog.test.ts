import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import { ScalarTeleport } from '../ScalarTeleport'
import ScalarDialog from './ScalarDialog.vue'

enableAutoUnmount(afterEach)

const prototype = HTMLDialogElement.prototype
const originalShowModal = Object.getOwnPropertyDescriptor(prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(prototype, 'close')

/** Dispatch an Escape keydown from an element, the way a real keypress bubbles. */
const pressEscape = (element: Element): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  element.dispatchEvent(event)
  return event
}

describe('ScalarDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
    document.documentElement.removeAttribute('style')

    // jsdom does not implement the native dialog API, so stand in for the parts the component uses
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
    if (originalShowModal) {
      Object.defineProperty(prototype, 'showModal', originalShowModal)
    } else {
      Reflect.deleteProperty(prototype, 'showModal')
    }
    if (originalClose) {
      Object.defineProperty(prototype, 'close', originalClose)
    } else {
      Reflect.deleteProperty(prototype, 'close')
    }
  })

  it('opens and closes the native dialog from the model', async () => {
    const wrapper = mount(ScalarDialog, { props: { open: true } })
    await nextTick()
    expect(wrapper.get('dialog').element.open).toBe(true)

    await wrapper.setProps({ open: false })
    expect(wrapper.get('dialog').element.open).toBe(false)
    expect(wrapper.emitted('close')).toEqual([[]])
  })

  it('unmounts closed content by default', async () => {
    const wrapper = mount(ScalarDialog, {
      props: { open: true },
      slots: { default: '<input aria-label="Draft" />' },
    })
    await wrapper.get('input').setValue('Temporary content')
    await wrapper.setProps({ open: false })
    expect(wrapper.find('input').exists()).toBe(false)

    await wrapper.setProps({ open: true })
    expect(wrapper.get('input').element.value).toBe('')
  })

  it('keeps content mounted across open and close with persist', async () => {
    const wrapper = mount(ScalarDialog, {
      props: { open: true, persist: true },
      slots: { default: '<input aria-label="Draft" />' },
    })
    await wrapper.get('input').setValue('Unsaved request')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.get('input').element.value).toBe('Unsaved request')
  })

  it('locks page scrolling while open', async () => {
    document.documentElement.style.setProperty('overflow', 'auto')
    const wrapper = mount(ScalarDialog, { props: { open: true } })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')

    await wrapper.setProps({ open: false })
    expect(document.documentElement.style.overflow).toBe('auto')
  })

  it('releases the scroll lock when unmounted while open', async () => {
    const wrapper = mount(ScalarDialog, { props: { open: true } })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')

    wrapper.unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('closes on Escape and stops a search input from also clearing', async () => {
    const wrapper = mount(ScalarDialog, {
      props: { open: true },
      slots: { default: '<input type="search" aria-label="Search" />' },
    })
    await nextTick()
    const event = pressEscape(wrapper.get('input').element)

    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('leaves Escape to a child widget that already handled it', async () => {
    const wrapper = mount(ScalarDialog, {
      props: { open: true },
      slots: { default: '<input aria-label="Options" />' },
    })
    await nextTick()
    const input = wrapper.get('input').element
    input.addEventListener('keydown', (event) => event.preventDefault())
    pressEscape(input)

    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('closes only the innermost of nested dialogs on Escape', async () => {
    const closed: string[] = []
    const wrapper = mount(ScalarDialog, {
      props: { open: true, 'onUpdate:open': () => closed.push('outer') },
      slots: {
        default: () => h(ScalarDialog, { open: true, 'onUpdate:open': () => closed.push('inner') }, () => h('input')),
      },
    })
    await nextTick()
    pressEscape(wrapper.get('input').element)

    expect(closed).toEqual(['inner'])
  })

  it('routes a native cancel through the model instead of closing directly', async () => {
    const wrapper = mount(ScalarDialog, { props: { open: true } })
    await nextTick()
    const cancel = new Event('cancel', { cancelable: true })
    wrapper.get('dialog').element.dispatchEvent(cancel)

    expect(cancel.defaultPrevented).toBe(true)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('ignores a stale close event that lands after the dialog reopens', async () => {
    const wrapper = mount(ScalarDialog, { props: { open: true } })
    await nextTick()
    wrapper.get('dialog').element.dispatchEvent(new Event('close'))

    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits close even when the dialog reopens before the native close event fires', async () => {
    // Real browsers queue the close event, so swap in a close that never dispatches it
    Object.defineProperty(prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false
      },
    })
    const wrapper = mount(ScalarDialog, { props: { open: true } })
    await nextTick()
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })

    expect(wrapper.emitted('close')).toEqual([[]])
    expect(wrapper.get('dialog').element.open).toBe(true)
  })

  it('leaves the dialog open when Escape cancels an IME composition', async () => {
    const wrapper = mount(ScalarDialog, {
      props: { open: true },
      slots: { default: '<input aria-label="Name" />' },
    })
    await nextTick()
    wrapper
      .get('input')
      .element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, isComposing: true }),
      )

    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('closes only the inner dialog when its backdrop is clicked', async () => {
    const closed: string[] = []
    const wrapper = mount(ScalarDialog, {
      props: { open: true, 'onUpdate:open': () => closed.push('outer') },
      slots: {
        default: () => h(ScalarDialog, { open: true, 'onUpdate:open': () => closed.push('inner') }),
      },
    })
    await nextTick()
    // jsdom lays everything out as an empty box at the origin, so this point is outside both dialogs
    const inner = wrapper.findAll('dialog')[1]!.element
    const position = { bubbles: true, button: 0, clientX: 10, clientY: 10 }
    inner.dispatchEvent(new MouseEvent('pointerdown', position))
    inner.dispatchEvent(new MouseEvent('click', { ...position, detail: 1 }))

    expect(closed).toEqual(['inner'])
  })

  it('teleports popovers inside the dialog so they render above it', async () => {
    const wrapper = mount(ScalarDialog, {
      props: { open: true },
      slots: { default: () => h(ScalarTeleport, () => h('div', { id: 'popover' })) },
      attachTo: '#app',
    })
    await nextTick()

    expect(wrapper.get('dialog').element.querySelector('.scalar-teleport-root #popover')).not.toBeNull()
  })
})
