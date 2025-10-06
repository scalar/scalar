import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationTable from './OperationTable.vue'

const environment = {
  uid: 'env-1' as any,
  name: 'Env',
  value: 'v',
  color: 'c',
}

describe('OperationTable', () => {
  it('renders with empty data', () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [],
        environment,
        envVariables: [],
      },
    })

    expect(wrapper.exists()).toBe(true)
    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    // Should have one empty row added by displayData computed
    expect(rows.length).toBe(1)
  })

  it('renders with provided data', () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [
          { name: 'header1', value: 'value1', isEnabled: true },
          { name: 'header2', value: 'value2', isEnabled: false },
        ],
        environment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    // Should have 2 data rows + 1 empty row
    expect(rows.length).toBe(3)
  })

  it('adds empty row when last row has content', () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: 'key2', value: 'val2', isEnabled: true },
        ],
        environment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    // Original 2 rows + 1 empty row
    expect(rows.length).toBe(3)
  })

  it('does not add empty row when last row is already empty', () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: '', value: '', isEnabled: false },
        ],
        environment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    // Only 2 rows, no additional empty row needed
    expect(rows.length).toBe(2)
  })

  it('emits addRow when updating last row', async () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [{ name: 'existing', value: 'data', isEnabled: true }],
        environment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    // Update the last row (index 1, which is the empty row)
    await rows[1]?.vm.$emit('updateRow', { key: 'new', value: 'row' })

    expect(wrapper.emitted('addRow')).toBeTruthy()
    expect(wrapper.emitted('addRow')?.[0]?.[0]).toEqual({
      key: 'new',
      value: 'row',
    })
  })

  it('emits updateRow when updating existing row', async () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: 'key2', value: 'val2', isEnabled: false },
        ],
        environment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    // Update first row (index 0)
    await rows[0]?.vm.$emit('updateRow', {
      key: 'updated',
      value: 'value',
      isEnabled: false,
    })

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { key: 'updated', value: 'value', isEnabled: false }])
  })

  it('emits deleteRow with correct index', async () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: 'key2', value: 'val2', isEnabled: true },
        ],
        environment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    await rows[1]?.vm.$emit('deleteRow')

    expect(wrapper.emitted('deleteRow')).toBeTruthy()
    expect(wrapper.emitted('deleteRow')?.[0]?.[0]).toBe(1)
  })

  it('emits uploadFile with correct index', async () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [{ name: 'file', value: '', isEnabled: true }],
        environment,
        envVariables: [],
        showUploadButton: true,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    await rows[0]?.vm.$emit('uploadFile')

    expect(wrapper.emitted('uploadFile')).toBeTruthy()
    expect(wrapper.emitted('uploadFile')?.[0]?.[0]).toBe(0)
  })

  it('emits removeFile with correct index', async () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [{ name: 'file', value: 'test.pdf', isEnabled: true }],
        environment,
        envVariables: [],
        showUploadButton: true,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'OperationTableRow' })
    await rows[0]?.vm.$emit('removeFile')

    expect(wrapper.emitted('removeFile')).toBeTruthy()
    expect(wrapper.emitted('removeFile')?.[0]?.[0]).toBe(0)
  })

  it('passes props to OperationTableRow correctly', () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [{ name: 'test', value: 'value', isEnabled: true }],
        environment,
        envVariables: [],
        isReadOnly: true,
        hasCheckboxDisabled: true,
        label: 'Custom Label',
        showUploadButton: true,
      },
    })

    const row = wrapper.findComponent({ name: 'OperationTableRow' })
    expect(row.props('isReadOnly')).toBe(true)
    expect(row.props('hasCheckboxDisabled')).toBe(true)
    expect(row.props('label')).toBe('Custom Label')
    expect(row.props('showUploadButton')).toBe(true)
  })

  it('renders DataTableHeader with correct label', () => {
    const wrapper = mount(OperationTable, {
      props: {
        data: [],
        environment,
        envVariables: [],
        label: 'Parameter',
      },
    })

    const headers = wrapper.findAllComponents({ name: 'DataTableHeader' })
    expect(headers[0]?.text()).toBe('Parameter Enabled')
    expect(headers[1]?.text()).toBe('Parameter Key')
    expect(headers[2]?.text()).toBe('Parameter Value')
  })
})
