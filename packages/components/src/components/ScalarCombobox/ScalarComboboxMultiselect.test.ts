import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ScalarComboboxMultiselect from './ScalarComboboxMultiselect.vue'
import ScalarComboboxOption from './ScalarComboboxOption.vue'
import type { Option, OptionGroup } from './types'

// Mock data
const singleOptions = [
  { id: '1', label: 'Option 1' },
  { id: '2', label: 'Option 2' },
  { id: '3', label: 'Option 3' },
] as const satisfies Option[]

const groupedOptions = [
  {
    label: 'Group 1',
    options: [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
    ],
  },
  {
    label: 'Group 2',
    options: [
      { id: '3', label: 'Option 3' },
      { id: '4', label: 'Option 4' },
    ],
  },
] as const satisfies OptionGroup[]

type ExtendedOption = Option & { category: string }

// Extended options for slot testing
const extendedOptions = [
  { id: '1', label: 'Apple', category: 'fruit' },
  { id: '2', label: 'Banana', category: 'fruit' },
] as const satisfies ExtendedOption[]

describe('ScalarComboboxMultiselect', () => {
  describe('with single options', () => {
    it('allows multiple selections', async () => {
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: {
          options: singleOptions,
          modelValue: [],
          'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
        },
        slots: { default: '<button>Toggle</button>' },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const optionElements = wrapper.findAllComponents(ScalarComboboxOption)
      await optionElements[0]?.trigger('click')
      await optionElements[1]?.trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted?.[emitted.length - 1]?.[0]).toHaveLength(2)
    })
  })

  describe('with grouped options', () => {
    it('allows multiple selections', async () => {
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: {
          options: groupedOptions,
          modelValue: [],
          'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
        },
        slots: { default: '<button>Toggle</button>' },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const optionElements = wrapper.findAllComponents(ScalarComboboxOption)
      await optionElements[0]?.trigger('click')
      await optionElements[1]?.trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted?.[emitted.length - 1]?.[0]).toHaveLength(2)
    })
  })

  describe('slot functionality', () => {
    it('renders before and after slots in multiselect mode', async () => {
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: { options: singleOptions },
        slots: {
          default: '<button>Toggle</button>',
          before: '<div data-test="before-multiselect">Before multiselect</div>',
          after: '<div data-test="after-multiselect">After multiselect</div>',
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="before-multiselect"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-multiselect"]').exists()).toBe(true)
    })

    it('renders custom option slot with selection state in multiselect', async () => {
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: {
          options: extendedOptions,
          modelValue: [extendedOptions[0]], // Pre-select first option
        },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option, selected }">
              <div data-test="multiselect-option">
                <span data-test="option-selected-state">{{ selected }}</span>
                <span data-test="option-label">{{ option.label }}</span>
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const selectedOptions = wrapper.findAll('[data-test="option-selected-state"]')
      expect(selectedOptions[0]?.text()).toBe('true') // First option should be selected
      expect(selectedOptions[1]?.text()).toBe('false') // Second option should not be selected
    })
  })
})
