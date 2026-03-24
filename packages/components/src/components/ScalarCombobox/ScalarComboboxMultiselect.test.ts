import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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
      const onUpdate = vi.fn((value) => {
        wrapper.setProps({ modelValue: value })
      })
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: {
          options: singleOptions,
          modelValue: [],
          'onUpdate:modelValue': onUpdate,
        },
        slots: { default: '<button>Toggle</button>' },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const optionElements = wrapper.findAllComponents(ScalarComboboxOption)
      await optionElements[0]?.trigger('click')
      await optionElements[1]?.trigger('click')

      expect(onUpdate).toHaveBeenCalled()
      const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]
      expect(lastCall?.[0]).toHaveLength(2)
    })
  })

  describe('with grouped options', () => {
    it('allows multiple selections', async () => {
      const onUpdate = vi.fn((value) => {
        wrapper.setProps({ modelValue: value })
      })
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: {
          options: groupedOptions,
          modelValue: [],
          'onUpdate:modelValue': onUpdate,
        },
        slots: { default: '<button>Toggle</button>' },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const optionElements = wrapper.findAllComponents(ScalarComboboxOption)
      await optionElements[0]?.trigger('click')
      await optionElements[1]?.trigger('click')

      expect(onUpdate).toHaveBeenCalled()
      const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]
      expect(lastCall?.[0]).toHaveLength(2)
    })
  })

  describe('slot functionality', () => {
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

  describe('add slot', () => {
    it('renders add slot when provided', async () => {
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: { options: singleOptions },
        slots: {
          default: '<button>Toggle</button>',
          add: `
            <template #add>
              <div data-test="add-slot">Create</div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="add-slot"]').exists()).toBe(true)
    })

    it('focuses add option when no results and keeps popover open on add', async () => {
      const onAdd = vi.fn()
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: { options: singleOptions, modelValue: [], onAdd },
        slots: {
          default: '<button>Toggle</button>',
          add: `
            <template #add>
              <div data-test="add-slot">Create</div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const input = wrapper.find('input[type="text"]')
      await input.setValue('not-present')
      await nextTick()

      const addEl = wrapper.find('[data-test="add-slot"]').element
      const addLi = addEl.closest('li') as HTMLLIElement | null
      const ariaId = input.attributes('aria-activedescendant')
      expect(addLi).toBeTruthy()
      expect(ariaId).toBe(addLi?.id)

      // Clicking add should emit add but the popover stays open in multiselect
      await wrapper.get('[data-test="add-slot"]').trigger('click')
      expect(onAdd).toHaveBeenCalled()
      expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)
    })

    it('navigates to add via arrow keys and Enter emits add (open remains)', async () => {
      const onAdd = vi.fn()
      const wrapper = mount(ScalarComboboxMultiselect, {
        props: { options: singleOptions, modelValue: [], onAdd },
        slots: {
          default: '<button>Toggle</button>',
          add: `
            <template #add>
              <div data-test="add-slot">Create</div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const input = wrapper.find('input[type="text"]')
      await input.trigger('keydown.down')
      await input.trigger('keydown.down')
      await input.trigger('keydown.down')
      await input.trigger('keydown.down')

      const addEl = wrapper.find('[data-test="add-slot"]').element
      const addLi = addEl.closest('li') as HTMLLIElement | null
      const ariaId = input.attributes('aria-activedescendant')
      expect(addLi).toBeTruthy()
      expect(ariaId).toBe(addLi?.id)

      await input.trigger('keydown.enter')
      expect(onAdd).toHaveBeenCalled()
      // Multiselect does not close on add
      expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)
    })
  })
})
