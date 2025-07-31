import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarComboboxOptions from './ScalarComboboxOptions.vue'
import ScalarComboboxOption from './ScalarComboboxOption.vue'
import ScalarComboboxOptionGroup from './ScalarComboboxOptionGroup.vue'
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

describe('ScalarComboboxOptions', () => {
  describe('with single options', () => {
    it('filters options based on search query', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: singleOptions },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Option 2')

      const filteredOptions = wrapper.findAllComponents(ScalarComboboxOption)
      expect(filteredOptions).toHaveLength(1)
      expect(filteredOptions[0]?.text()).toBe('Option 2')
    })

    it('focuses the input when component is mounted', async () => {
      vi.useFakeTimers()

      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: singleOptions },
        attachTo: document.body,
      })

      await vi.runAllTimers()

      const input = wrapper.find('input[type="text"]')
      expect(input.element).toBe(document.activeElement)

      wrapper.unmount()

      vi.useRealTimers()
    })
  })

  describe('with grouped options', () => {
    it('filters options based on search query', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: groupedOptions },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Option 2')

      const filteredOptions = wrapper.findAllComponents(ScalarComboboxOption)
      expect(filteredOptions).toHaveLength(1)
      expect(filteredOptions[0]?.text()).toBe('Option 2')
    })
  })

  describe('slot functionality', () => {
    it('renders before and after slots', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: singleOptions },
        slots: {
          before: '<div data-test="options-before">Before options content</div>',
          after: '<div data-test="options-after">After options content</div>',
        },
      })

      expect(wrapper.find('[data-test="options-before"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="options-before"]').text()).toBe('Before options content')
      expect(wrapper.find('[data-test="options-after"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="options-after"]').text()).toBe('After options content')
    })

    it('passes correct props to option slot', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: {
          options: extendedOptions,
          modelValue: [extendedOptions[0]], // Pre-select first option
        },
        slots: {
          option: `
            <template #option="{ option, active, selected }">
              <div data-test="slot-option">
                <span data-test="option-id">{{ option.id }}</span>
                <span data-test="option-label">{{ option.label }}</span>
                <span data-test="option-category">{{ option.category }}</span>
                <span data-test="option-active">{{ active }}</span>
                <span data-test="option-selected">{{ selected }}</span>
              </div>
            </template>
          `,
        },
      })

      const slotOptions = wrapper.findAll('[data-test="slot-option"]')
      expect(slotOptions).toHaveLength(2)

      // Check first option (should be selected)
      const firstOption = slotOptions[0]
      expect(firstOption?.find('[data-test="option-id"]').text()).toBe('1')
      expect(firstOption?.find('[data-test="option-label"]').text()).toBe('Apple')
      expect(firstOption?.find('[data-test="option-category"]').text()).toBe('fruit')
      expect(firstOption?.find('[data-test="option-selected"]').text()).toBe('true')

      // Check second option (should not be selected)
      const secondOption = slotOptions[1]
      expect(secondOption?.find('[data-test="option-id"]').text()).toBe('2')
      expect(secondOption?.find('[data-test="option-label"]').text()).toBe('Banana')
      expect(secondOption?.find('[data-test="option-selected"]').text()).toBe('false')
    })

    it('passes correct props to group slot', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: extendedGroups },
        slots: {
          group: `
            <template #group="{ group }">
              <div data-test="slot-group">
                <span data-test="group-label">{{ group.label }}</span>
                <span data-test="group-icon">{{ group.icon }}</span>
                <span data-test="group-options-count">{{ group.options.length }}</span>
              </div>
            </template>
          `,
        },
      })

      const slotGroups = wrapper.findAll('[data-test="slot-group"]')
      expect(slotGroups).toHaveLength(2)

      // Check first group
      const firstGroup = slotGroups[0]
      expect(firstGroup?.find('[data-test="group-label"]').text()).toBe('Fruits')
      expect(firstGroup?.find('[data-test="group-icon"]').text()).toBe('🍎')
      expect(firstGroup?.find('[data-test="group-options-count"]').text()).toBe('2')

      // Check second group
      const secondGroup = slotGroups[1]
      expect(secondGroup?.find('[data-test="group-label"]').text()).toBe('Vegetables')
      expect(secondGroup?.find('[data-test="group-icon"]').text()).toBe('🥕')
      expect(secondGroup?.find('[data-test="group-options-count"]').text()).toBe('2')
    })

    it('maintains slot functionality while filtering', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: extendedGroups },
        slots: {
          before: '<div data-test="before-filter">Before with filtering</div>',
          option: `
            <template #option="{ option }">
              <div data-test="filtered-option">{{ option.label }}</div>
            </template>
          `,
          group: `
            <template #group="{ group }">
              <div data-test="filtered-group">{{ group.label }}</div>
            </template>
          `,
          after: '<div data-test="after-filter">After with filtering</div>',
        },
      })

      // Before filtering
      expect(wrapper.findAll('[data-test="filtered-option"]')).toHaveLength(4)
      expect(wrapper.findAll('[data-test="filtered-group"]')).toHaveLength(2)

      // Apply filter
      const input = wrapper.find('input[type="text"]')
      await input.setValue('Apple')
      await nextTick()

      // After filtering - should only show matching options
      const filteredOptions = wrapper.findAll('[data-test="filtered-option"]')
      expect(filteredOptions).toHaveLength(1)
      expect(filteredOptions[0]?.text()).toBe('Apple')

      // Before/after slots should still be visible
      expect(wrapper.find('[data-test="before-filter"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-filter"]').exists()).toBe(true)

      // Only groups with matching options should show their labels
      const visibleGroups = wrapper.findAll('[data-test="filtered-group"]')
      expect(visibleGroups).toHaveLength(1)
      expect(visibleGroups[0]?.text()).toBe('Fruits')
    })

    it('handles multiselect mode with custom slots', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: {
          options: extendedOptions,
          modelValue: [extendedOptions[0], extendedOptions[1]], // Pre-select both options
          multiselect: true,
        },
        slots: {
          option: `
            <template #option="{ option, selected }">
              <div data-test="multiselect-slot-option">
                <span data-test="selection-indicator">{{ selected ? '✓' : '○' }}</span>
                <span data-test="option-label">{{ option.label }}</span>
              </div>
            </template>
          `,
        },
      })

      const multiselectOptions = wrapper.findAll('[data-test="multiselect-slot-option"]')
      expect(multiselectOptions).toHaveLength(2)

      // Both options should be selected
      const selectionIndicators = wrapper.findAll('[data-test="selection-indicator"]')
      expect(selectionIndicators[0]?.text()).toBe('✓')
      expect(selectionIndicators[1]?.text()).toBe('✓')
    })

    it('handles option click events with custom slots', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: extendedOptions },
        slots: {
          option: `
            <template #option="{ option }">
              <div data-test="clickable-option">{{ option.label }}</div>
            </template>
          `,
        },
      })

      const clickableOption = wrapper.find('[data-test="clickable-option"]')
      await clickableOption.trigger('click')

      // Should emit model value update
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[extendedOptions[0]]])
    })
  })

  describe('edge cases', () => {
    it('handles empty options array gracefully', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: [] },
      })

      // Should render the search input
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)

      // Should not render any options
      const options = wrapper.findAllComponents(ScalarComboboxOption)
      expect(options).toHaveLength(0)

      // Should render one hidden group (default group for non-grouped options)
      const groups = wrapper.findAllComponents(ScalarComboboxOptionGroup)
      expect(groups).toHaveLength(1)
      // The group should be hidden since there are no options to display
      expect(groups[0]?.props('hidden')).toBe(true)

      // Search should still work (but return no results)
      await input.setValue('test search')
      const filteredOptions = wrapper.findAllComponents(ScalarComboboxOption)
      expect(filteredOptions).toHaveLength(0)
    })

    it('handles empty grouped options array gracefully', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: [] as OptionGroup[] },
      })

      // Should render the search input
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)

      // Should not render any options
      const options = wrapper.findAllComponents(ScalarComboboxOption)
      expect(options).toHaveLength(0)

      // Even when typed as OptionGroup[], empty arrays are treated as simple options
      // due to isGroups() returning false for empty arrays, so we get one hidden default group
      const groups = wrapper.findAllComponents(ScalarComboboxOptionGroup)
      expect(groups).toHaveLength(1)
      expect(groups[0]?.props('hidden')).toBe(true)
    })

    it('handles empty options array with custom slots', async () => {
      // Test that the component doesn't crash with empty options and renders slots properly
      const wrapper = mount(ScalarComboboxOptions, {
        props: {
          options: singleOptions, // Start with options to avoid the isGroups issue
          modelValue: [],
        },
        slots: {
          before: '<div data-test="before-content">Before content</div>',
          after: '<div data-test="after-content">After content</div>',
        },
      })

      // Before/after slots should be visible
      expect(wrapper.find('[data-test="before-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-content"]').exists()).toBe(true)

      // Should have options initially
      expect(wrapper.findAllComponents(ScalarComboboxOption).length).toBeGreaterThan(0)

      // Now update to empty options
      await wrapper.setProps({ options: [] })
      await nextTick()

      // Before/after slots should still be visible
      expect(wrapper.find('[data-test="before-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-content"]').exists()).toBe(true)

      // No options should be rendered now
      expect(wrapper.findAllComponents(ScalarComboboxOption)).toHaveLength(0)
    })
  })

  describe('performance and edge interactions', () => {
    it('handles rapid slot updates without errors', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: singleOptions },
        slots: {
          option: `
            <template #option="{ option }">
              <div data-test="rapid-option">{{ option.label }}</div>
            </template>
          `,
        },
      })

      // Rapidly change the search query
      const input = wrapper.find('input[type="text"]')
      for (const query of ['Op', 'Opt', 'Opti', 'Optio', 'Option']) {
        await input.setValue(query)
        await nextTick()
      }

      // Should still render correctly after rapid changes
      const finalOptions = wrapper.findAll('[data-test="rapid-option"]')
      expect(finalOptions.length).toBeGreaterThan(0)
    })

    it('handles slot content with complex event handlers', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: singleOptions },
        slots: {
          option: `
            <template #option="{ option }">
              <div 
                data-test="clickable-slot-option"
                @click.stop="() => { /* complex handler */ }"
              >
                {{ option.label }}
              </div>
            </template>
          `,
        },
      })

      // Need to click on the actual option wrapper (ScalarComboboxOption), not just the slot content
      const optionComponent = wrapper.findComponent(ScalarComboboxOption)
      await optionComponent.trigger('click')

      // Should not cause errors and should emit the update
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })
})
