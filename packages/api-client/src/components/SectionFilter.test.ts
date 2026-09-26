import type { ApiReferenceLocalization } from '@scalar/types/api-reference'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { provideLocalization } from '@/v2/features/localization'

import SectionFilter from './SectionFilter.vue'

describe('SectionFilter', () => {
  it.each([
    { direction: 'ltr', right: 'Body', left: 'All' },
    { direction: 'rtl', right: 'All', left: 'Body' },
  ] as const)(
    'moves selection and focus in the visual arrow direction in $direction',
    async ({ direction, right, left }) => {
      const selected = ref<string | undefined>('Headers')
      const wrapper = mount(
        defineComponent({
          setup() {
            provideLocalization({ direction })
            return () =>
              h(SectionFilter, {
                filters: ['All', 'Headers', 'Body'],
                modelValue: selected.value,
                'onUpdate:modelValue': (value: string | undefined) => {
                  selected.value = value
                },
              })
          },
        }),
        { attachTo: document.body },
      )

      await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(selected.value).toBe(right)
      expect(document.activeElement).toBe(wrapper.get('[aria-selected="true"]').element)

      // Continuing in the same visual direction wraps at the edge.
      await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(selected.value).toBe(left)

      selected.value = 'Headers'
      await nextTick()
      await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(selected.value).toBe(left)
      expect(document.activeElement).toBe(wrapper.get('[aria-selected="true"]').element)
      wrapper.unmount()
    },
  )

  it('updates keyboard direction when localization changes and honors an explicit override', async () => {
    const localization = ref<ApiReferenceLocalization>({ locale: 'en' })
    const selected = ref<string | undefined>('Headers')
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization(localization)
          return () =>
            h(SectionFilter, {
              filters: ['All', 'Headers', 'Body'],
              modelValue: selected.value,
              'onUpdate:modelValue': (value: string | undefined) => {
                selected.value = value
              },
            })
        },
      }),
    )

    localization.value = { locale: 'ar' }
    await nextTick()
    await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' })
    expect(selected.value).toBe('All')

    localization.value = { locale: 'ar', direction: 'ltr' }
    await nextTick()
    await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' })
    expect(selected.value).toBe('Headers')
    wrapper.unmount()
  })

  it('renders tabs without aria-controls so NVDA does not re-announce the selection', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization({ locale: 'en' })
          return () =>
            h(SectionFilter, {
              filters: ['All', 'Headers', 'Body'],
              modelValue: 'Headers',
            })
        },
      }),
    )

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(3)
    for (const tab of tabs) {
      expect(tab.attributes('aria-controls')).toBeUndefined()
    }
    expect(wrapper.findAll('[role="tablist"]')).toHaveLength(1)
    expect(tabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1)
    wrapper.unmount()
  })
})
