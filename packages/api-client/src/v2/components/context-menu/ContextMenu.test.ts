import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ContextMenu from './ContextMenu.vue'

describe('ContextMenu', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the trigger slot', () => {
    const wrapper = mount(ContextMenu, {
      slots: {
        trigger: '<button type="button">Open menu</button>',
        content: 'Menu body',
      },
    })

    expect(wrapper.get('button').text()).toBe('Open menu')
  })

  it('applies triggerClass to the radix trigger element', () => {
    const wrapper = mount(ContextMenu, {
      props: { triggerClass: 'context-menu-trigger-test' },
      slots: {
        trigger: '<span>Target</span>',
        content: 'Menu body',
      },
    })

    const trigger = wrapper.get('.context-menu-trigger-test')
    expect(trigger.text()).toBe('Target')
  })

  it('opens the menu and exposes the content slot after contextmenu', async () => {
    const wrapper = mount(ContextMenu, {
      attachTo: document.body,
      slots: {
        trigger: '<button type="button" id="ctx-trigger">Target</button>',
        content: '<span id="ctx-body">Menu body</span>',
      },
    })

    await wrapper.get('#ctx-trigger').trigger('contextmenu')
    await nextTick()
    await flushPromises()

    const item = document.getElementById('ctx-body')
    expect(item).toBeInstanceOf(HTMLElement)
    expect((item as HTMLElement).textContent).toBe('Menu body')

    wrapper.unmount()
  })

  it('keeps the menu closed when disabled', async () => {
    const wrapper = mount(ContextMenu, {
      attachTo: document.body,
      props: { disabled: true },
      slots: {
        trigger: '<button type="button" id="ctx-trigger">Target</button>',
        content: '<span id="ctx-body">Menu body</span>',
      },
    })

    await wrapper.get('#ctx-trigger').trigger('contextmenu')
    await nextTick()
    await flushPromises()

    expect(document.getElementById('ctx-body')).toBe(null)

    wrapper.unmount()
  })
})
