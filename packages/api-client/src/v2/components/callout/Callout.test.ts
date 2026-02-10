import { ScalarIconCheckCircle, ScalarIconInfo, ScalarIconWarning, ScalarIconWarningCircle } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Callout from './Callout.vue'

describe('rendering', () => {
  it('renders with info type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: 'This is an info message',
      },
    })

    /**
     * The component should render successfully with info type.
     * This is the most common callout type used for informational messages.
     */
    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.find('.callout__info').exists()).toBe(true)
    expect(wrapper.text()).toContain('This is an info message')
  })

  it('renders with success type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'success',
      },
      slots: {
        default: 'Operation completed successfully',
      },
    })

    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.find('.callout__success').exists()).toBe(true)
    expect(wrapper.text()).toContain('Operation completed successfully')
  })

  it('renders with warning type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'warning',
      },
      slots: {
        default: 'This is a warning',
      },
    })

    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.find('.callout__warning').exists()).toBe(true)
    expect(wrapper.text()).toContain('This is a warning')
  })

  it('renders with danger type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'danger',
      },
      slots: {
        default: 'This is dangerous',
      },
    })

    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.find('.callout__danger').exists()).toBe(true)
    expect(wrapper.text()).toContain('This is dangerous')
  })

  it('renders with neutral type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'neutral',
      },
      slots: {
        default: 'This is a neutral message',
      },
    })

    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.find('.callout__neutral').exists()).toBe(true)
    expect(wrapper.text()).toContain('This is a neutral message')
  })
})

describe('icons', () => {
  it('renders ScalarIconInfo for info type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: 'Info message',
      },
    })

    /**
     * Info callouts should display the info icon to visually indicate the message type.
     */
    const icon = wrapper.findComponent(ScalarIconInfo)
    expect(icon.exists()).toBe(true)

    const iconContainer = wrapper.find('[data-scalar-name="callout-icon"]')
    expect(iconContainer.exists()).toBe(true)
  })

  it('renders ScalarIconCheckCircle for success type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'success',
      },
      slots: {
        default: 'Success message',
      },
    })

    /**
     * Success callouts should display a check circle icon.
     */
    const icon = wrapper.findComponent(ScalarIconCheckCircle)
    expect(icon.exists()).toBe(true)
  })

  it('renders ScalarIconWarning for warning type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'warning',
      },
      slots: {
        default: 'Warning message',
      },
    })

    /**
     * Warning callouts should display a warning icon.
     */
    const icon = wrapper.findComponent(ScalarIconWarning)
    expect(icon.exists()).toBe(true)
  })

  it('renders ScalarIconWarningCircle for danger type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'danger',
      },
      slots: {
        default: 'Danger message',
      },
    })

    /**
     * Danger callouts should display a warning circle icon to indicate urgency.
     */
    const icon = wrapper.findComponent(ScalarIconWarningCircle)
    expect(icon.exists()).toBe(true)
  })

  it('renders ScalarIconInfo for neutral type', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'neutral',
      },
      slots: {
        default: 'Neutral message',
      },
    })

    /**
     * Neutral callouts should display the info icon by default.
     */
    const icon = wrapper.findComponent(ScalarIconInfo)
    expect(icon.exists()).toBe(true)
  })
})

describe('default slot', () => {
  it('renders default slot content', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: 'This is the main content',
      },
    })

    /**
     * The default slot should render the main message content.
     */
    expect(wrapper.find('.callout-content__text').exists()).toBe(true)
    expect(wrapper.text()).toContain('This is the main content')
  })

  it('renders HTML content in default slot', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: '<strong>Bold text</strong> and <em>italic text</em>',
      },
    })

    /**
     * The default slot should support HTML content for rich formatting.
     */
    const textContent = wrapper.find('.callout-content__text')
    expect(textContent.html()).toContain('<strong>Bold text</strong>')
    expect(textContent.html()).toContain('<em>italic text</em>')
  })

  it('renders multiline content in default slot', () => {
    const multilineContent = `Line 1
Line 2
Line 3`

    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: multilineContent,
      },
    })

    /**
     * The default slot should handle multiline content properly.
     */
    expect(wrapper.text()).toContain('Line 1')
    expect(wrapper.text()).toContain('Line 2')
    expect(wrapper.text()).toContain('Line 3')
  })
})

describe('actions slot', () => {
  it('renders actions slot when provided', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'warning',
      },
      slots: {
        default: 'This requires action',
        actions: '<button>Confirm</button><button>Cancel</button>',
      },
    })

    /**
     * When actions are provided, they should be rendered in a separate section.
     * This allows users to interact with the callout.
     */
    const actionsContainer = wrapper.find('.flex.justify-end.gap-2')
    expect(actionsContainer.exists()).toBe(true)
    expect(actionsContainer.html()).toContain('<button>Confirm</button>')
    expect(actionsContainer.html()).toContain('<button>Cancel</button>')
  })

  it('does not render actions section when actions slot is not provided', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: 'Just information, no actions needed',
      },
    })

    /**
     * When no actions are provided, the actions section should not be rendered.
     * This keeps the callout clean and focused on the message.
     */
    const actionsContainer = wrapper.find('.flex.justify-end.gap-2')
    expect(actionsContainer.exists()).toBe(false)
  })

  it('renders actions with default and actions slots together', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'danger',
      },
      slots: {
        default: 'Are you sure you want to delete this?',
        actions: '<button>Delete</button><button>Cancel</button>',
      },
    })

    /**
     * Both content and actions should be rendered together properly.
     * The content should appear above the actions.
     */
    expect(wrapper.text()).toContain('Are you sure you want to delete this?')
    expect(wrapper.html()).toContain('<button>Delete</button>')
    expect(wrapper.html()).toContain('<button>Cancel</button>')

    // Verify the structure: content first, then actions
    const contentSection = wrapper.find('.callout-content__text')
    const actionsSection = wrapper.find('.flex.justify-end.gap-2')
    expect(contentSection.exists()).toBe(true)
    expect(actionsSection.exists()).toBe(true)
  })
})

describe('edge cases', () => {
  it('handles empty default slot gracefully', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: '',
      },
    })

    /**
     * Even with empty content, the component should render without errors.
     * The icon and structure should still be present.
     */
    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.find('.callout-content__icon').exists()).toBe(true)
    expect(wrapper.find('.callout-content__text').exists()).toBe(true)
  })

  it('handles very long content', () => {
    const longContent = 'Lorem ipsum '.repeat(100)

    const wrapper = mount(Callout, {
      props: {
        type: 'info',
      },
      slots: {
        default: longContent,
      },
    })

    /**
     * Long content should be rendered without breaking the layout.
     * The component should handle wrapping and overflow gracefully.
     */
    expect(wrapper.find('.callout').exists()).toBe(true)
    expect(wrapper.text()).toContain('Lorem ipsum')

    // The text container should exist and contain the long content
    const textContainer = wrapper.find('.callout-content__text')
    expect(textContainer.exists()).toBe(true)
  })

  it('handles multiple action buttons', () => {
    const wrapper = mount(Callout, {
      props: {
        type: 'warning',
      },
      slots: {
        default: 'Choose an option',
        actions: `
            <button>Option 1</button>
            <button>Option 2</button>
            <button>Option 3</button>
            <button>Option 4</button>
          `,
      },
    })

    /**
     * Multiple action buttons should be rendered in the actions section.
     * The gap-2 utility should space them properly.
     */
    const actionsContainer = wrapper.find('.flex.justify-end.gap-2')
    expect(actionsContainer.exists()).toBe(true)
    expect(actionsContainer.html()).toContain('<button>Option 1</button>')
    expect(actionsContainer.html()).toContain('<button>Option 4</button>')
  })
})
