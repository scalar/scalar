import { type VueWrapper, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SectionContainerAccordion from './SectionContainerAccordion.vue'

/** Mounts a closed accordion, reporting toggles through the returned spy. */
const mountAccordion = (title: string): { wrapper: VueWrapper; onUpdate: ReturnType<typeof vi.fn> } => {
  const onUpdate = vi.fn()
  const wrapper = mount(SectionContainerAccordion, {
    props: { modelValue: false, 'onUpdate:modelValue': onUpdate },
    slots: { title },
  })

  return { wrapper, onUpdate }
}

describe('SectionContainerAccordion', () => {
  it('toggles from the button the title lies over', async () => {
    const { wrapper, onUpdate } = mountAccordion('<span class="title">Planets</span>')

    // The title renders beside the button, not inside it, and lets clicks through to it.
    expect(wrapper.get('.section-accordion-button').element.contains(wrapper.get('.title').element)).toBe(false)

    await wrapper.get('.section-accordion-button').trigger('click')

    expect(onUpdate.mock.calls).toEqual([[true]])
  })

  it('names the button after the title', () => {
    const { wrapper } = mountAccordion('<span class="title">Planets</span>')
    const labelledBy = wrapper.get('.section-accordion-button').attributes('aria-labelledby')

    expect(wrapper.get(`[id="${labelledBy}"]`).text()).toBe('Planets')
  })

  it('leaves clicks on a control in the title to that control', async () => {
    const { wrapper, onUpdate } = mountAccordion('<button class="copy-link" type="button">Copy link</button>')

    await wrapper.get('.copy-link').trigger('click')

    expect(onUpdate).not.toHaveBeenCalled()
  })
})
