import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestTableTooltip from '@/v2/blocks/request-block/components/RequestTableTooltip.vue'
import { CodeInput } from '@/v2/components/code-input'
import { DataTableCheckbox } from '@/v2/components/data-table'

import OperationTableRow from './RequestTableRow.vue'

const environment = {
  description: 'Test Environment',
  variables: [],
  color: 'c',
}

describe('OperationTableRow', () => {
  it('renders with minimal props', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: '', value: '' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders with data', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'test-key', value: 'test-value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const codeInputs = wrapper.findAllComponents(CodeInput)
    expect(codeInputs[0]?.props('modelValue')).toBe('test-key')
    expect(codeInputs[1]?.props('modelValue')).toBe('test-value')
  })

  it('displays checkbox when no globalRoute is provided', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'test', value: 'value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.findComponent(DataTableCheckbox).exists()).toBe(true)
  })

  it('emits updateRow when checkbox is toggled', async () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'test', value: 'value', isDisabled: false },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const checkbox = wrapper.findComponent(DataTableCheckbox)
    await checkbox.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]?.[0]).toEqual({ isEnabled: false })
  })

  it('disables checkbox when hasCheckboxDisabled is true', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'test', value: 'value' },
        environment,
        hasCheckboxDisabled: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const checkbox = wrapper.findComponent(DataTableCheckbox)
    expect(checkbox.props('disabled')).toBe(true)
  })

  it('emits updateRow when key input changes', async () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'old-key', value: 'value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const keyInput = wrapper.findAllComponents(CodeInput)[0]
    await keyInput?.vm.$emit('update:modelValue', 'new-key')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]?.[0]).toEqual({ key: 'new-key' })
  })

  it('emits updateRow when value input changes', async () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: 'old-value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const valueInput = wrapper.findAllComponents(CodeInput)[1]
    await valueInput?.vm.$emit('update:modelValue', 'new-value')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]?.[0]).toEqual({ value: 'new-value' })
  })

  it('disables inputs when isReadOnly is true', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: 'value' },
        environment,
        isReadOnly: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const codeInputs = wrapper.findAllComponents(CodeInput)
    expect(codeInputs[0]?.props('disabled')).toBe(true)
    expect(codeInputs[1]?.props('disabled')).toBe(true)
  })

  it('displays tooltip when schema exists', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: {
          name: 'key',
          value: 'value',
          schema: { type: 'string' },
        },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.findComponent(RequestTableTooltip).exists()).toBe(true)
  })

  it('does not display tooltip when schema does not exist', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: 'value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.findComponent(RequestTableTooltip).exists()).toBe(false)
  })

  it('displays file upload button when showUploadButton is true', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: '' },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Upload File')
  })

  it('emits uploadFile when upload button is clicked', async () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: '' },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const uploadButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    const uploadButton = uploadButtons.find((btn) => btn.text().includes('Upload File'))
    await uploadButton?.vm.$emit('click')

    expect(wrapper.emitted('uploadFile')).toBeTruthy()
  })

  it('displays file name when value is a File instance', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('test.txt')
  })

  it('handles null value correctly', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: null },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const valueInput = wrapper.findAllComponents(CodeInput)[1]
    expect(valueInput?.props('modelValue')).toBe('')
  })

  it('marks key input as required when isRequired is true', () => {
    const wrapper = mount(OperationTableRow, {
      props: {
        data: { name: 'key', value: 'value', isRequired: true },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const keyInput = wrapper.findAllComponents(CodeInput)[0]
    expect(keyInput?.props('required')).toBe(true)
  })
})
