import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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
      const wrapper = mount(ScalarCombobox, {
        props: { options: singleOptions },
        slots: { default: '<button>Toggle</button>' },
        attachTo: document.body,
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const input = wrapper.find('input[type="text"]')
      expect(input.element).toBe(document.activeElement)

      wrapper.unmount()
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
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([groupedOptions[0].options[0]])
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
      await optionElements[0].trigger('click')
      await optionElements[1].trigger('click')

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
      await optionElements[0].trigger('click')
      await optionElements[1].trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted?.[emitted.length - 1]?.[0]).toHaveLength(2)
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
      expect(filteredOptions[0].text()).toBe('Option 2')
    })

    it('focuses the input when component is mounted', async () => {
      const wrapper = mount(ScalarComboboxOptions, {
        props: { options: singleOptions },
        attachTo: document.body,
      })

      await nextTick()

      const input = wrapper.find('input[type="text"]')
      expect(input.element).toBe(document.activeElement)

      wrapper.unmount()
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
      expect(filteredOptions[0].text()).toBe('Option 2')
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

  it('emits delete event when delete icon is clicked', async () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: {
        isDeletable: true,
      },
      slots: {
        default: 'Option Text',
      },
    })

    const deleteIcon = wrapper.find('[aria-label="Delete"]')
    await deleteIcon.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
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
