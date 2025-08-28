import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarCombobox from './ScalarCombobox.vue'
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

type ExtendedGroup = OptionGroup<ExtendedOption> & { icon: string }

const extendedGroups = [
  {
    label: 'Fruits',
    icon: '🍎',
    options: [
      { id: '1', label: 'Apple', category: 'fruit' },
      { id: '2', label: 'Banana', category: 'fruit' },
    ],
  },
  {
    label: 'Vegetables',
    icon: '🥕',
    options: [
      { id: '3', label: 'Carrot', category: 'vegetable' },
      { id: '4', label: 'Broccoli', category: 'vegetable' },
    ],
  },
] as const satisfies ExtendedGroup[]

describe('ScalarCombobox', () => {
  describe('with single options', () => {
    it('emits update:modelValue when option is selected', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: { default: '<button>Toggle</button>' },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const option = wrapper.findComponent(ScalarComboboxOption)
      await option.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([singleOptions[0]])
    })

    it('focuses the input when combobox is opened', async () => {
      vi.useFakeTimers()

      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: { default: '<button>Toggle</button>' },
        attachTo: document.body,
      })

      await wrapper.find('button').trigger('click')
      // We use a time out to focus the input
      await vi.runAllTimers()

      const input = wrapper.find('input[type="text"]')
      expect(input.element).toBe(document.activeElement)

      wrapper.unmount()

      vi.useRealTimers()
    })

    it('closes combobox when tabbing out of the input', async () => {
      // Create a container with the combobox and another focusable element
      const container = document.createElement('div')
      container.innerHTML = '<button id="after-button">After Button</button>'
      document.body.appendChild(container)

      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: { default: '<button>Toggle</button>' },
        attachTo: container,
      })

      // Open the combobox
      await wrapper.find('button').trigger('click')
      await nextTick()

      // Verify it's open by checking if the input is visible
      const input = wrapper.find('input[type="text"]')
      expect(input.isVisible()).toBe(true)

      // Move focus to the button outside the combobox to simulate tabbing out
      const afterButton = document.getElementById('after-button') as HTMLButtonElement
      afterButton.focus()
      await nextTick()

      // Wait a bit for the popover to close
      await new Promise((resolve) => setTimeout(resolve, 50))
      await nextTick()

      // Check if the popover is closed by looking for the options list
      const optionsList = wrapper.find('ul[role="listbox"]')
      expect(optionsList.exists()).toBe(false)

      wrapper.unmount()
      document.body.removeChild(container)
    })
  })

  describe('with grouped options', () => {
    it('emits update:modelValue when option is selected', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: groupedOptions },
        slots: { default: '<button>Toggle</button>' },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const option = wrapper.findComponent(ScalarComboboxOption)
      await option.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([groupedOptions[0]?.options?.[0]])
    })
  })

  describe('slot functionality', () => {
    it('renders custom option slot with correct props', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: extendedOptions },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option, active, selected }">
              <div data-test="custom-option">
                <span data-test="option-label">{{ option.label }}</span>
                <span data-test="option-category">{{ option.category }}</span>
                <span data-test="option-active">{{ active }}</span>
                <span data-test="option-selected">{{ selected }}</span>
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const customOption = wrapper.find('[data-test="custom-option"]')
      expect(customOption.exists()).toBe(true)

      const optionLabel = wrapper.find('[data-test="option-label"]')
      expect(optionLabel.text()).toBe('Apple')

      const optionCategory = wrapper.find('[data-test="option-category"]')
      expect(optionCategory.text()).toBe('fruit')
    })

    it('renders custom group slot with correct props', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: extendedGroups },
        slots: {
          default: '<button>Toggle</button>',
          group: `
            <template #group="{ group }">
              <div data-test="custom-group">
                <span data-test="group-icon">{{ group.icon }}</span>
                <span data-test="group-label">{{ group.label }}</span>
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const customGroup = wrapper.find('[data-test="custom-group"]')
      expect(customGroup.exists()).toBe(true)

      const groupIcon = wrapper.find('[data-test="group-icon"]')
      expect(groupIcon.text()).toBe('🍎')

      const groupLabel = wrapper.find('[data-test="group-label"]')
      expect(groupLabel.text()).toBe('Fruits')
    })

    it('combines multiple slots correctly', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: extendedGroups },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option }">
              <div data-test="custom-option">{{ option.label }}</div>
            </template>
          `,
          group: `
            <template #group="{ group }">
              <div data-test="custom-group">{{ group.label }}</div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      // All slots should be present
      expect(wrapper.find('[data-test="custom-option"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="custom-group"]').exists()).toBe(true)
    })

    it('does not render slots when they are not provided', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: {
          default: '<button>Toggle</button>',
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      // Should use default option rendering, not custom slots
      const listboxCheckbox = wrapper.find('[role="listbox"]')
      expect(listboxCheckbox.exists()).toBe(true)

      // Should not have custom slot content
      expect(wrapper.find('[data-test="custom-option"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="custom-group"]').exists()).toBe(false)
    })
  })

  describe('add slot', () => {
    it('renders add slot when provided', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: {
          default: '<button>Toggle</button>',
          add: `
            <template #add>
              <div data-test="add-slot">Add New</div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="add-slot"]').exists()).toBe(true)

      // Click the add option
      await wrapper.get('[data-test="add-slot"]').trigger('click')
      expect(wrapper.emitted('add')).toBeTruthy()

      // Popover should be closed after add (single-select closes on add)
      await nextTick()
      expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
    })

    it('focuses add option when there are no query results', async () => {
      const wrapper = mount(ScalarCombobox, {
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

      const input = wrapper.find('input[type="text"]')
      await input.setValue('not-present')
      await nextTick()

      const addEl = wrapper.find('[data-test="add-slot"]').element
      const addLi = addEl.closest('li') as HTMLLIElement | null
      const ariaId = input.attributes('aria-activedescendant')

      expect(addLi).toBeTruthy()
      expect(ariaId).toBe(addLi?.id)
    })

    it('includes add in arrow key navigation and Enter triggers add', async () => {
      const wrapper = mount(ScalarCombobox, {
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
      expect(wrapper.emitted('add')).toBeTruthy()
      await nextTick()
      expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
    })
  })

  describe('edge cases and error handling', () => {
    it('handles malformed option objects gracefully', async () => {
      const malformedOptions = [
        { id: '1', label: 'Valid Option' },
        { id: '2', label: '' }, // Empty label
        { id: '3', label: 'Another Valid Option' },
      ]

      const wrapper = mount(ScalarCombobox, {
        props: { options: malformedOptions },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option }">
              <div data-test="malformed-option">
                {{ option.label || 'No Label' }}
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      // Should render all options including ones with empty labels
      const renderedOptions = wrapper.findAll('[data-test="malformed-option"]')
      expect(renderedOptions).toHaveLength(3)
      expect(renderedOptions[1]?.text()).toBe('No Label') // Empty label should show "No Label"
    })

    it('handles empty group arrays', async () => {
      const emptyGroups = [
        { label: 'Empty Group', options: [] },
        { label: 'Valid Group', options: singleOptions },
      ]

      const wrapper = mount(ScalarCombobox, {
        props: { options: emptyGroups },
        slots: {
          default: '<button>Toggle</button>',
          group: `
            <template #group="{ group }">
              <div data-test="group-with-count">
                {{ group.label }} ({{ group.options.length }})
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const groupElements = wrapper.findAll('[data-test="group-with-count"]')
      expect(groupElements).toHaveLength(1) // Only valid group should show
      expect(groupElements[0]?.text()).toContain('Valid Group (3)')
    })

    it('updates slots when options change', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions.slice(0, 1) }, // Start with one option
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option }">
              <div data-test="reactive-option">{{ option.label }}</div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      // Initially should have one option
      expect(wrapper.findAll('[data-test="reactive-option"]')).toHaveLength(1)

      // Update to all options
      await wrapper.setProps({ options: singleOptions })
      await nextTick()

      // Should now have all options
      expect(wrapper.findAll('[data-test="reactive-option"]')).toHaveLength(3)
    })

    it('maintains slot state during model value changes', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: {
          options: extendedOptions,
          modelValue: extendedOptions[0],
        },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option, selected }">
              <div data-test="state-option">
                {{ option.label }} - {{ selected ? 'Selected' : 'Not Selected' }}
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const options = wrapper.findAll('[data-test="state-option"]')
      expect(options[0]?.text()).toContain('Apple - Selected')
      expect(options[1]?.text()).toContain('Banana - Not Selected')

      // Change model value
      await wrapper.setProps({ modelValue: extendedOptions[1] })
      await nextTick()

      const updatedOptions = wrapper.findAll('[data-test="state-option"]')
      expect(updatedOptions[0]?.text()).toContain('Apple - Not Selected')
      expect(updatedOptions[1]?.text()).toContain('Banana - Selected')
    })

    it('handles nested Vue components in slots', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: extendedOptions },
        global: {
          components: {
            NestedComponent: {
              props: ['option'],
              template: `
                <div data-test="nested-component">
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.category }}</small>
                </div>
              `,
            },
          },
        },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option }">
              <NestedComponent :option="option" />
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const nestedComponents = wrapper.findAll('[data-test="nested-component"]')
      expect(nestedComponents).toHaveLength(2)
      expect(nestedComponents[0]?.find('strong').text()).toBe('Apple')
      expect(nestedComponents[0]?.find('small').text()).toBe('fruit')
    })

    it('handles conditional slot rendering based on option properties', async () => {
      const conditionalOptions = [
        { id: '1', label: 'Premium Option', isPremium: true },
        { id: '2', label: 'Regular Option', isPremium: false },
      ]

      const wrapper = mount(ScalarCombobox, {
        props: { options: conditionalOptions },
        slots: {
          default: '<button>Toggle</button>',
          option: `
            <template #option="{ option }">
              <div data-test="conditional-option">
                {{ option.label }}
                <span v-if="option.isPremium" data-test="premium-badge">⭐</span>
              </div>
            </template>
          `,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const premiumBadges = wrapper.findAll('[data-test="premium-badge"]')
      expect(premiumBadges).toHaveLength(1)

      const optionElements = wrapper.findAll('[data-test="conditional-option"]')
      expect(optionElements[0]?.text()).toContain('⭐')
      expect(optionElements[1]?.text()).not.toContain('⭐')
    })
  })
})
