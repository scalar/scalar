import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EnvironmentVariablesTable from './EnvironmentVariablesTable.vue'

const mockEnvironment = {
  uid: '' as any,
  name: '',
  value: '',
  color: '',
}

const mockData = [
  { name: 'API_URL', value: 'https://api.example.com' },
  { name: 'API_KEY', value: 'secret-key-123' },
]

describe('EnvironmentVariablesTable', () => {
  it('renders the DataTable component', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    expect(dataTable.exists()).toBe(true)
  })

  it('renders table headers', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Value')
    expect(wrapper.text()).toContain('Actions')
  })

  it('renders existing variables', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** 2 variables x 2 inputs (name + value) + 1 empty row x 2 = 6 total */
    expect(codeInputs.length).toBeGreaterThanOrEqual(4)

    /** Check first variable */
    expect(codeInputs[0]?.props('modelValue')).toBe('API_URL')
    expect(codeInputs[1]?.props('modelValue')).toBe('https://api.example.com')

    /** Check second variable */
    expect(codeInputs[2]?.props('modelValue')).toBe('API_KEY')
    expect(codeInputs[3]?.props('modelValue')).toBe('secret-key-123')
  })

  it('adds empty row at the end when last row has data', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** 2 data rows x 2 inputs + 1 empty row x 2 inputs = 6 total */
    expect(codeInputs.length).toBe(6)
  })

  it('does not add extra empty row when last row is already empty', () => {
    const dataWithEmptyRow = [
      { name: 'API_URL', value: 'https://api.example.com' },
      { name: '', value: '' },
    ]

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: dataWithEmptyRow,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** 2 data rows x 2 inputs = 4 total (no extra empty row) */
    expect(codeInputs.length).toBe(4)
  })

  it('emits updateRow when updating existing variable name', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    await codeInputs[0]?.vm.$emit('update:modelValue', 'NEW_API_URL')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { name: 'NEW_API_URL' }])
  })

  it('emits updateRow when updating existing variable value', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    await codeInputs[1]?.vm.$emit('update:modelValue', 'https://new-api.example.com')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { value: 'https://new-api.example.com' }])
  })

  it('emits addRow when updating empty row', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** The last pair of inputs is the empty row */
    const lastNameInput = codeInputs[codeInputs.length - 2]
    await lastNameInput?.vm.$emit('update:modelValue', 'NEW_VAR')

    expect(wrapper.emitted('addRow')).toBeTruthy()
    expect(wrapper.emitted('addRow')?.[0]).toEqual([{ name: 'NEW_VAR' }])
  })

  it('emits deleteRow when clicking delete button', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    await deleteButtons[0]?.vm.$emit('click')

    expect(wrapper.emitted('deleteRow')).toBeTruthy()
    expect(wrapper.emitted('deleteRow')?.[0]).toEqual([0])
  })

  it('renders delete button for each row', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    /** 2 data rows + 1 empty row = 3 delete buttons */
    expect(deleteButtons.length).toBe(3)
  })

  it('sets correct placeholder for name input', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** First input is the name field of empty row */
    expect(codeInputs[0]?.props('placeholder')).toBe('Name')
  })

  it('sets correct placeholder for value input', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** Second input is the value field of empty row */
    expect(codeInputs[1]?.props('placeholder')).toBe('Value')
  })

  it('handles empty data array', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** 1 empty row x 2 inputs = 2 total */
    expect(codeInputs.length).toBe(2)
  })

  it('handles multiple updates to the same row', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })

    /** Update name */
    await codeInputs[0]?.vm.$emit('update:modelValue', 'UPDATED_NAME')
    /** Update value */
    await codeInputs[1]?.vm.$emit('update:modelValue', 'updated-value')

    expect(wrapper.emitted('updateRow')).toHaveLength(2)
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { name: 'UPDATED_NAME' }])
    expect(wrapper.emitted('updateRow')?.[1]).toEqual([0, { value: 'updated-value' }])
  })

  it('emits deleteRow with correct index for second row', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    await deleteButtons[1]?.vm.$emit('click')

    expect(wrapper.emitted('deleteRow')).toBeTruthy()
    expect(wrapper.emitted('deleteRow')?.[0]).toEqual([1])
  })

  it('handles partial data in last row', () => {
    const partialData = [
      { name: 'API_URL', value: 'https://api.example.com' },
      { name: 'PARTIAL', value: '' },
    ]

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: partialData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** 2 data rows x 2 inputs + 1 empty row x 2 inputs = 6 total */
    expect(codeInputs.length).toBe(6)
  })

  it('enables lineWrapping on name input', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs[0]?.props('lineWrapping')).toBe(true)
  })

  it('enables lineWrapping on value input', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs[1]?.props('lineWrapping')).toBe(true)
  })

  it('disables close brackets on name input', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs[0]?.props('disableCloseBrackets')).toBe(true)
  })

  it('disables tab indent on both name and value inputs', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs[0]?.props('disableTabIndent')).toBe(true)
    expect(codeInputs[1]?.props('disableTabIndent')).toBe(true)
  })

  it('handles adding variable to empty table', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    await codeInputs[0]?.vm.$emit('update:modelValue', 'FIRST_VAR')

    expect(wrapper.emitted('addRow')).toBeTruthy()
    expect(wrapper.emitted('addRow')?.[0]).toEqual([{ name: 'FIRST_VAR' }])
  })

  it('handles adding value to empty row', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** The last input is the value field of empty row */
    const lastValueInput = codeInputs[codeInputs.length - 1]
    await lastValueInput?.vm.$emit('update:modelValue', 'new-value')

    expect(wrapper.emitted('addRow')).toBeTruthy()
    expect(wrapper.emitted('addRow')?.[0]).toEqual([{ value: 'new-value' }])
  })

  it('renders trash icon in delete button', () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const trashIcons = wrapper.findAllComponents({ name: 'ScalarIconTrash' })
    /** One trash icon per row (including empty row) */
    expect(trashIcons.length).toBe(3)
  })

  it('emits separate events for each deleted row', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButtons = wrapper.findAllComponents({ name: 'ScalarButton' })

    /** Delete first row */
    await deleteButtons[0]?.vm.$emit('click')
    /** Delete second row */
    await deleteButtons[1]?.vm.$emit('click')

    expect(wrapper.emitted('deleteRow')).toHaveLength(2)
    expect(wrapper.emitted('deleteRow')?.[0]).toEqual([0])
    expect(wrapper.emitted('deleteRow')?.[1]).toEqual([1])
  })

  it('handles updating multiple rows sequentially', async () => {
    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: mockData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })

    /** Update first row name */
    await codeInputs[0]?.vm.$emit('update:modelValue', 'UPDATED_1')
    /** Update second row name */
    await codeInputs[2]?.vm.$emit('update:modelValue', 'UPDATED_2')

    expect(wrapper.emitted('updateRow')).toHaveLength(2)
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { name: 'UPDATED_1' }])
    expect(wrapper.emitted('updateRow')?.[1]).toEqual([1, { name: 'UPDATED_2' }])
  })

  it('handles large dataset', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      name: `VAR_${i}`,
      value: `value_${i}`,
    }))

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        data: largeData,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** 50 data rows x 2 inputs + 1 empty row x 2 inputs = 102 total */
    expect(codeInputs.length).toBe(102)
  })
})
