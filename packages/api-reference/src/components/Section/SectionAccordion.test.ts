import { type VueWrapper, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SectionAccordion from './SectionAccordion.vue'

/** Mounts a closed accordion, reporting toggles through the returned spy. */
const mountAccordion = (title: string): { wrapper: VueWrapper; onUpdate: ReturnType<typeof vi.fn> } => {
  const onUpdate = vi.fn()
  const wrapper = mount(SectionAccordion, {
    props: { modelValue: false, 'onUpdate:modelValue': onUpdate },
    slots: { title },
  })

  return { wrapper, onUpdate }
}

describe('SectionAccordion', () => {
  it('toggles from the button the header row lies over', async () => {
    const { wrapper, onUpdate } = mountAccordion('<span class="title">Messages</span>')

    // The title renders beside the button, not inside it, and lets clicks through to it.
    expect(wrapper.get('.section-accordion-button').element.contains(wrapper.get('.title').element)).toBe(false)

    await wrapper.get('.section-accordion-button').trigger('click')

    expect(onUpdate.mock.calls).toEqual([[true]])
  })

  it('leaves clicks on a control in the header to that control', async () => {
    const { wrapper, onUpdate } = mountAccordion('<button class="copy-link" type="button">Copy link</button>')

    await wrapper.get('.copy-link').trigger('click')

    expect(onUpdate).not.toHaveBeenCalled()
  })
})
