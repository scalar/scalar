import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationTableTooltip from './OperationTableTooltip.vue'

const ScalarPopoverStub = {
  name: 'ScalarPopover',
  template: '<div><slot /><div class="popover-content"><slot name="popover" /></div></div>',
}

const ScalarIconInfoStub = {
  name: 'ScalarIconInfo',
  template: '<span class="icon-info" />',
}

const ScalarIconWarningStub = {
  name: 'ScalarIconWarning',
  template: '<span class="icon-warning" />',
}

describe('OperationTableTooltip', () => {
  it('renders with minimal props', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: '',
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('displays info icon when value is valid', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'test',
        schema: { type: 'string' },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.findComponent(ScalarIconInfoStub).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconWarningStub).exists()).toBe(false)
  })

  it('displays warning icon when value is invalid', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'not-a-number',
        schema: { type: 'number' },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.findComponent(ScalarIconWarningStub).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconInfoStub).exists()).toBe(false)
  })

  it('sets correct aria-label for valid input', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'test',
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('More Information')
  })

  it('sets correct aria-label and role for invalid input', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'invalid',
        schema: { type: 'number' },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Input is invalid')
    expect(button.attributes('role')).toBe('alert')
  })

  it('displays schema type information', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: '123',
        schema: { type: 'number' },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).toContain('number')
  })

  it('displays schema format information', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'test@example.com',
        schema: { type: 'string', format: 'email' },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).toContain('email')
  })

  it('displays minimum and maximum constraints', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: '5',
        schema: { type: 'number', minimum: 1, maximum: 10 },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).toContain('min: 1')
    expect(wrapper.text()).toContain('max: 10')
  })

  it('displays default value', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: '',
        schema: { type: 'string', default: 'default-value' },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).toContain('default: default-value')
  })

  it('displays schema description when value is valid', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'test',
        schema: {
          type: 'string',
          description: 'This is a test parameter',
        },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).toContain('This is a test parameter')
  })

  it('does not display description when value is invalid', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: 'invalid',
        schema: {
          type: 'number',
          description: 'This is a test parameter',
        },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).not.toContain('This is a test parameter')
  })

  it('handles null value', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: null,
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconInfoStub).exists()).toBe(true)
  })

  it('handles File value', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: file,
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('displays all schema properties together', () => {
    const wrapper = mount(OperationTableTooltip, {
      props: {
        value: '5',
        schema: {
          type: 'number',
          format: 'int32',
          minimum: 1,
          maximum: 10,
          default: 5,
          description: 'A number between 1 and 10',
        },
      },
      global: {
        stubs: {
          ScalarPopover: ScalarPopoverStub,
          ScalarIconInfo: ScalarIconInfoStub,
          ScalarIconWarning: ScalarIconWarningStub,
        },
      },
    })

    expect(wrapper.text()).toContain('number')
    expect(wrapper.text()).toContain('int32')
    expect(wrapper.text()).toContain('min: 1')
    expect(wrapper.text()).toContain('max: 10')
    expect(wrapper.text()).toContain('default: 5')
    expect(wrapper.text()).toContain('A number between 1 and 10')
  })
})
