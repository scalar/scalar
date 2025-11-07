import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SidebarListElementForm from './ConfirmationForm.vue'

describe('SidebarListElementForm', () => {
  it('handles form submission and cancellation events correctly', async () => {
    const wrapper = mount(SidebarListElementForm, {
      slots: {
        default: '<input type="text" data-testid="form-input" />',
      },
    })

    // Verify form structure
    const form = wrapper.find('form')
    expect(form.exists()).toBe(true)

    // Verify slot content is rendered
    const slotInput = wrapper.find('[data-testid="form-input"]')
    expect(slotInput.exists()).toBe(true)

    // Verify both buttons are rendered
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)

    const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')
    const submitButton = buttons.find((btn) => btn.attributes('type') === 'submit')

    expect(cancelButton).toBeTruthy()
    expect(submitButton).toBeTruthy()

    // Verify cancel button emits cancel event
    await cancelButton!.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')).toHaveLength(1)

    // Verify form submission emits submit event
    await form.trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')).toHaveLength(1)

    // Verify multiple events can be emitted
    await cancelButton!.trigger('click')
    await form.trigger('submit')
    await form.trigger('submit')

    expect(wrapper.emitted('cancel')).toHaveLength(2)
    expect(wrapper.emitted('submit')).toHaveLength(3)
  })

  it('renders with customizable props and button variants', () => {
    // Test default props
    const defaultWrapper = mount(SidebarListElementForm)

    const defaultSubmitButton = defaultWrapper
      .findAllComponents({ name: 'ScalarButton' })
      .find((btn) => btn.attributes('type') === 'submit')
    expect(defaultSubmitButton).toBeTruthy()
    expect(defaultSubmitButton!.text()).toBe('Save')
    expect(defaultSubmitButton!.props('variant')).toBe('solid')

    const defaultCancelButton = defaultWrapper
      .findAllComponents({ name: 'ScalarButton' })
      .find((btn) => btn.text().includes('Cancel'))
    expect(defaultCancelButton).toBeTruthy()
    expect(defaultCancelButton!.props('variant')).toBe('outlined')

    // Test custom label prop
    const customLabelWrapper = mount(SidebarListElementForm, {
      props: {
        label: 'Create Document',
      },
    })

    const customLabelSubmitButton = customLabelWrapper
      .findAllComponents({ name: 'ScalarButton' })
      .find((btn) => btn.attributes('type') === 'submit')
    expect(customLabelSubmitButton).toBeTruthy()
    expect(customLabelSubmitButton!.text()).toBe('Create Document')
    expect(customLabelSubmitButton!.props('variant')).toBe('solid')

    // Test danger variant prop
    const dangerWrapper = mount(SidebarListElementForm, {
      props: {
        label: 'Delete Item',
        variant: 'danger',
      },
    })

    const dangerSubmitButton = dangerWrapper
      .findAllComponents({ name: 'ScalarButton' })
      .find((btn) => btn.attributes('type') === 'submit')
    expect(dangerSubmitButton).toBeTruthy()
    expect(dangerSubmitButton!.text()).toBe('Delete Item')
    expect(dangerSubmitButton!.props('variant')).toBe('danger')

    // Verify cancel button variant remains outlined regardless of submit button variant
    const dangerCancelButton = dangerWrapper
      .findAllComponents({ name: 'ScalarButton' })
      .find((btn) => btn.text().includes('Cancel'))
    expect(dangerCancelButton).toBeTruthy()
    expect(dangerCancelButton!.props('variant')).toBe('outlined')
  })
})
