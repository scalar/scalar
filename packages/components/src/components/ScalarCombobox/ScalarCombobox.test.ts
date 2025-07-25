import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarCombobox from './ScalarCombobox.vue'
import ScalarComboboxMultiselect from './ScalarComboboxMultiselect.vue'
import ScalarComboboxOption from './ScalarComboboxOption.vue'
import ScalarComboboxOptions from './ScalarComboboxOptions.vue'
import ScalarComboboxOptionGroup from './ScalarComboboxOptionGroup.vue'
import ScalarComboboxPopover from './ScalarComboboxPopover.vue'

// Mock data
const singleOptions = [
  { id: '1', label: 'Option 1' },
  { id: '2', label: 'Option 2' },
  { id: '3', label: 'Option 3' },
]

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
]

// Extended options for slot testing
const extendedOptions = [
  { id: '1', label: 'Apple', category: 'fruit' },
  { id: '2', label: 'Banana', category: 'fruit' },
]

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
]

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
    it('renders before and after slots', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: {
          default: '<button>Toggle</button>',
          before: '<div data-test="before-content">Before content</div>',
          after: '<div data-test="after-content">After content</div>',
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="before-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="before-content"]').text()).toBe('Before content')
      expect(wrapper.find('[data-test="after-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-content"]').text()).toBe('After content')
    })

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
          before: '<div data-test="before">Before content</div>',
          after: '<div data-test="after">After content</div>',
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
      expect(wrapper.find('[data-test="before"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after"]').exists()).toBe(true)
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
})

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
      expect(selectedOptions[0].text()).toBe('true') // First option should be selected
      expect(selectedOptions[1].text()).toBe('false') // Second option should not be selected
    })
  })
})

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
      expect(firstOption.find('[data-test="option-id"]').text()).toBe('1')
      expect(firstOption.find('[data-test="option-label"]').text()).toBe('Apple')
      expect(firstOption.find('[data-test="option-category"]').text()).toBe('fruit')
      expect(firstOption.find('[data-test="option-selected"]').text()).toBe('true')

      // Check second option (should not be selected)
      const secondOption = slotOptions[1]
      expect(secondOption.find('[data-test="option-id"]').text()).toBe('2')
      expect(secondOption.find('[data-test="option-label"]').text()).toBe('Banana')
      expect(secondOption.find('[data-test="option-selected"]').text()).toBe('false')
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
      expect(firstGroup.find('[data-test="group-label"]').text()).toBe('Fruits')
      expect(firstGroup.find('[data-test="group-icon"]').text()).toBe('🍎')
      expect(firstGroup.find('[data-test="group-options-count"]').text()).toBe('2')

      // Check second group
      const secondGroup = slotGroups[1]
      expect(secondGroup.find('[data-test="group-label"]').text()).toBe('Vegetables')
      expect(secondGroup.find('[data-test="group-icon"]').text()).toBe('🥕')
      expect(secondGroup.find('[data-test="group-options-count"]').text()).toBe('2')
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
      expect(filteredOptions[0].text()).toBe('Apple')

      // Before/after slots should still be visible
      expect(wrapper.find('[data-test="before-filter"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-filter"]').exists()).toBe(true)

      // Only groups with matching options should show their labels
      const visibleGroups = wrapper.findAll('[data-test="filtered-group"]')
      expect(visibleGroups).toHaveLength(1)
      expect(visibleGroups[0].text()).toBe('Fruits')
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
      expect(selectionIndicators[0].text()).toBe('✓')
      expect(selectionIndicators[1].text()).toBe('✓')
    })

    it('shows/hides slots based on content availability', async () => {
      const wrapper = mount(ScalarCombobox, {
        props: { options: [] }, // Empty options
        slots: {
          default: '<button>Toggle</button>',
          before: '<div data-test="before-empty">Before empty</div>',
          after: '<div data-test="after-empty">After empty</div>',
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      // Before/after slots should still be visible even with empty options
      expect(wrapper.find('[data-test="before-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="after-empty"]').exists()).toBe(true)

      // Options list should exist but have no options
      const optionsList = wrapper.find('ul[role="listbox"]')
      expect(optionsList.exists()).toBe(true)
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
})

describe('ScalarComboboxOptionGroup', () => {
  it('renders group label when not hidden', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: {
        id: 'test-group',
      },
      slots: {
        label: 'Group Label',
        default: '<div>Group Content</div>',
      },
    })

    expect(wrapper.text()).toContain('Group Label')
    expect(wrapper.text()).toContain('Group Content')
  })

  it('hides group label when hidden prop is true', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: {
        id: 'test-group',
        hidden: true,
      },
      slots: {
        label: 'Group Label',
        default: '<div>Group Content</div>',
      },
    })

    expect(wrapper.text()).not.toContain('Group Label')
    expect(wrapper.text()).toContain('Group Content')
  })

  it('uses provided ID when given', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: { id: 'custom-group-id' },
      slots: { default: '<div>Content</div>' },
    })

    const id = wrapper.attributes('id')
    expect(id).toBe('custom-group-id')
  })

  it('handles custom slot content properly', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: { id: 'custom-group' },
      slots: {
        label: `
          <div data-test="custom-label">
            <span>📁</span>
            <span>Custom Group</span>
          </div>
        `,
        default: `
          <div data-test="custom-content">
            <button>Option 1</button>
            <button>Option 2</button>
          </div>
        `,
      },
    })

    expect(wrapper.find('[data-test="custom-label"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="custom-content"]').exists()).toBe(true)
    expect(wrapper.findAll('button')).toHaveLength(2)
  })
})

describe('ScalarComboboxOption', () => {
  it('renders option with correct styles', () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: {
        active: true,
        selected: true,
        style: 'checkbox',
      },
      slots: {
        default: 'Option Text',
      },
    })

    expect(wrapper.text()).toContain('Option Text')
    expect(wrapper.classes()).toContain('bg-b-2')
  })

  it('applies active and selected styles correctly', () => {
    const activeWrapper = mount(ScalarComboboxOption, {
      props: { active: true },
      slots: { default: 'Active Option' },
    })

    const selectedWrapper = mount(ScalarComboboxOption, {
      props: { selected: true },
      slots: { default: 'Selected Option' },
    })

    const inactiveWrapper = mount(ScalarComboboxOption, {
      props: { active: false, selected: false },
      slots: { default: 'Inactive Option' },
    })

    expect(activeWrapper.classes()).toContain('bg-b-2')
    expect(selectedWrapper.attributes('aria-selected')).toBe('true')
    expect(inactiveWrapper.classes()).not.toContain('bg-b-2')
  })

  it('passes slot props correctly', () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: { active: true, selected: false },
      slots: {
        default: `
          <template #default="{ active, selected }">
            <div data-test="slot-content">
              <span data-test="active-state">{{ active }}</span>
              <span data-test="selected-state">{{ selected }}</span>
            </div>
          </template>
        `,
      },
    })

    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="active-state"]').text()).toBe('true')
    expect(wrapper.find('[data-test="selected-state"]').text()).toBe('false')
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: { selected: true },
      slots: { default: 'Accessible Option' },
    })

    const element = wrapper.find('li')
    expect(element.attributes('role')).toBe('option')
    expect(element.attributes('tabindex')).toBe('-1')
    expect(element.attributes('aria-selected')).toBe('true')
  })
})

describe('ScalarComboboxPopover', () => {
  it('handles keyboard events correctly', async () => {
    const wrapper = mount(ScalarComboboxPopover, {
      slots: {
        default: '<button>Toggle</button>',
        popover: '<div test-id="popover-content">Popover Content</div>',
      },
    })

    const button = wrapper.find('button')
    await button.trigger('keydown', { key: 'ArrowDown' })

    // Check that the popover content exists instead of the wrapper
    expect(wrapper.find('[test-id="popover-content"]').exists()).toBeTruthy()
  })
})

describe('Edge Cases and Error Handling', () => {
  describe('empty and invalid data', () => {
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
      expect(renderedOptions[1].text()).toBe('No Label') // Empty label should show "No Label"
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
      expect(groupElements[0].text()).toContain('Valid Group (3)')
    })
  })

  describe('slot reactivity', () => {
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
      expect(options[0].text()).toContain('Apple - Selected')
      expect(options[1].text()).toContain('Banana - Not Selected')

      // Change model value
      await wrapper.setProps({ modelValue: extendedOptions[1] })
      await nextTick()

      const updatedOptions = wrapper.findAll('[data-test="state-option"]')
      expect(updatedOptions[0].text()).toContain('Apple - Not Selected')
      expect(updatedOptions[1].text()).toContain('Banana - Selected')
    })
  })

  describe('complex slot combinations', () => {
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
      expect(nestedComponents[0].find('strong').text()).toBe('Apple')
      expect(nestedComponents[0].find('small').text()).toBe('fruit')
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
      expect(optionElements[0].text()).toContain('⭐')
      expect(optionElements[1].text()).not.toContain('⭐')
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
