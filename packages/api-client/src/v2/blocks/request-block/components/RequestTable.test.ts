import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestTable from './RequestTable.vue'

const environment = {
  description: 'Test Environment',
  variables: [],
  color: 'c',
}

describe('RequestTable', () => {
  it('renders with empty data', () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [],
        environment,
      },
    })

    expect(wrapper.exists()).toBe(true)
    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    // Should have one empty row added by displayData computed
    expect(rows.length).toBe(1)
  })

  it('renders with provided data', () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [
          { name: 'header1', value: 'value1', isEnabled: true },
          { name: 'header2', value: 'value2', isEnabled: false },
        ],
        environment,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    // Should have 2 data rows + 1 empty row
    expect(rows.length).toBe(3)
  })

  it('adds empty row when last row has content', () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: 'key2', value: 'val2', isEnabled: true },
        ],
        environment,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    // Original 2 rows + 1 empty row
    expect(rows.length).toBe(3)
  })

  it('does not add empty row when last row is already empty', () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: '', value: '', isEnabled: false },
        ],
        environment,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    // Only 2 rows, no additional empty row needed
    expect(rows.length).toBe(2)
  })

  it('emits upsertRow when updating last row', async () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [{ name: 'existing', value: 'data', isEnabled: true }],
        environment,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    // Update the last row (index 1, which is the empty row)
    await rows[1]?.vm.$emit('upsertRow', {
      name: 'new',
      value: 'row',
      isDisabled: false,
    })

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]).toEqual([
      1,
      {
        name: 'new',
        value: 'row',
        isDisabled: false,
      },
    ])
  })

  it('emits upsertRow when updating existing row', async () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: 'key2', value: 'val2', isEnabled: false },
        ],
        environment,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    // Update first row (index 0)
    await rows[0]?.vm.$emit('upsertRow', {
      name: 'updated',
      value: 'value',
      isDisabled: true,
    })

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]).toEqual([0, { name: 'updated', value: 'value', isDisabled: true }])
  })

  it('emits deleteRow with correct index', async () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [
          { name: 'key1', value: 'val1', isEnabled: true },
          { name: 'key2', value: 'val2', isEnabled: true },
        ],
        environment,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    await rows[1]?.vm.$emit('deleteRow')

    expect(wrapper.emitted('deleteRow')).toBeTruthy()
    expect(wrapper.emitted('deleteRow')?.[0]?.[0]).toBe(1)
  })

  it('emits uploadFile with correct index', async () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [{ name: 'file', value: '', isEnabled: true }],
        environment,
        showUploadButton: true,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    await rows[0]?.vm.$emit('uploadFile')

    expect(wrapper.emitted('uploadFile')).toBeTruthy()
    expect(wrapper.emitted('uploadFile')?.[0]?.[0]).toBe(0)
  })

  it('emits removeFile with correct index', async () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [{ name: 'file', value: 'test.pdf', isEnabled: true }],
        environment,
        showUploadButton: true,
      },
    })

    const rows = wrapper.findAllComponents({ name: 'RequestTableRow' })
    await rows[0]?.vm.$emit('removeFile')

    expect(wrapper.emitted('removeFile')).toBeTruthy()
    expect(wrapper.emitted('removeFile')?.[0]?.[0]).toBe(0)
  })

  it('passes props to RequestTableRow correctly', () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [{ name: 'test', value: 'value', isEnabled: true }],
        environment,
        hasCheckboxDisabled: true,
        label: 'Custom Label',
        showUploadButton: true,
      },
    })

    const row = wrapper.findComponent({ name: 'RequestTableRow' })
    expect(row.props('hasCheckboxDisabled')).toBe(true)
    expect(row.props('label')).toBe('Custom Label')
    expect(row.props('showUploadButton')).toBe(true)
  })

  it('renders DataTableHeader with correct label', () => {
    const wrapper = mount(RequestTable, {
      props: {
        data: [],
        environment,
        label: 'Parameter',
      },
    })

    const headers = wrapper.findAllComponents({ name: 'DataTableHeader' })
    expect(headers[0]?.text()).toBe('Parameter Enabled')
    expect(headers[1]?.text()).toBe('Parameter Key')
    expect(headers[2]?.text()).toBe('Parameter Value')
  })
})
