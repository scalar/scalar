// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { DataTableRow } from '@/components/DataTable'

import CookiesTable from './CookiesTable.vue'

const mockEnvironment = {
  uid: '' as any,
  name: '',
  value: '',
  color: '',
}

describe('CookiesTable', () => {
  it('renders headers correctly', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Enabled')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Value')
    expect(wrapper.text()).toContain('Domain')
    expect(wrapper.text()).toContain('Actions')
  })

  it('renders existing cookie data', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** Check the cookie's values are passed as props to CodeInput components */
    expect(codeInputs[0]?.props('modelValue')).toBe('session_id')
    expect(codeInputs[1]?.props('modelValue')).toBe('abc123')
    expect(codeInputs[2]?.props('modelValue')).toBe('.example.com')
  })

  it('renders multiple cookies', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
          {
            name: 'auth_token',
            value: 'xyz789',
            domain: '.api.example.com',
            isDisabled: true,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** We should have 3 CodeInputs per row (name, value, domain) plus the empty row = 9 total */
    expect(codeInputs.length).toBeGreaterThanOrEqual(6)

    /** Check the first cookie's values are passed as props */
    expect(codeInputs[0]?.props('modelValue')).toBe('session_id')
    expect(codeInputs[1]?.props('modelValue')).toBe('abc123')
    expect(codeInputs[2]?.props('modelValue')).toBe('.example.com')

    /** Check the second cookie's values are passed as props */
    expect(codeInputs[3]?.props('modelValue')).toBe('auth_token')
    expect(codeInputs[4]?.props('modelValue')).toBe('xyz789')
    expect(codeInputs[5]?.props('modelValue')).toBe('.api.example.com')
  })

  it('adds an empty row when last row has data', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    /** The displayData computed should add one extra row for UI purposes */
    const rows = wrapper.findAllComponents(DataTableRow)
    /** +1 for the header row, +1 for the data row, +1 for the empty row */
    expect(rows.length).toBe(3)
  })

  it('does not add an empty row when last row is already empty', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
          { name: '', value: '', domain: '', isDisabled: false },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents(DataTableRow)
    /** +1 for the header row, +2 for the data rows */
    expect(rows.length).toBe(3)
  })

  it('emits updateRow event when updating an existing cookie name', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** First CodeInput is for the name field */
    codeInputs[0]?.vm.$emit('update:modelValue', 'new_session_id')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { name: 'new_session_id' }])
  })

  it('emits updateRow event when updating an existing cookie value', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** Second CodeInput is for the value field */
    await codeInputs[1]?.vm.$emit('update:modelValue', 'new_value')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { value: 'new_value' }])
  })

  it('emits updateRow event when updating an existing cookie domain', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** Third CodeInput is for the domain field */
    await codeInputs[2]?.vm.$emit('update:modelValue', '.newdomain.com')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { domain: '.newdomain.com' }])
  })

  it('emits addRow event when updating the empty row', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** The last set of CodeInputs corresponds to the empty row */
    const lastNameInput = codeInputs[codeInputs.length - 3]
    await lastNameInput?.vm.$emit('update:modelValue', 'new_cookie')

    expect(wrapper.emitted('addRow')).toBeTruthy()
    expect(wrapper.emitted('addRow')?.[0]).toEqual([{ name: 'new_cookie' }])
  })

  it('emits updateRow event when toggling checkbox for existing cookie', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const checkboxes = wrapper.findAllComponents({ name: 'DataTableCheckbox' })
    /** First checkbox is for the first data row */
    await checkboxes[0]?.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.[0]).toEqual([0, { isDisabled: true }])
  })

  it('emits addRow event when toggling checkbox for empty row', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const checkboxes = wrapper.findAllComponents({ name: 'DataTableCheckbox' })
    /** First checkbox corresponds to the empty row when data is empty */
    await checkboxes[0]?.vm.$emit('update:modelValue', true)

    expect(wrapper.emitted('addRow')).toBeTruthy()
    expect(wrapper.emitted('addRow')?.[0]).toEqual([{ isDisabled: false }])
  })

  it('emits deleteRow event when delete button is clicked', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    /** First delete button corresponds to the first row */
    await deleteButtons[0]?.vm.$emit('click')

    expect(wrapper.emitted('deleteRow')).toBeTruthy()
    expect(wrapper.emitted('deleteRow')?.[0]).toEqual([0])
  })

  it('handles disabled cookies correctly', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'disabled_cookie',
            value: 'test',
            domain: '.example.com',
            isDisabled: true,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const checkboxes = wrapper.findAllComponents({ name: 'DataTableCheckbox' })
    /** Check that the checkbox reflects the disabled state */
    expect(checkboxes[0]?.props('modelValue')).toBe(false)
  })

  it('handles enabled cookies correctly', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'enabled_cookie',
            value: 'test',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const checkboxes = wrapper.findAllComponents({ name: 'DataTableCheckbox' })
    /** Check that the checkbox reflects the enabled state */
    expect(checkboxes[0]?.props('modelValue')).toBe(true)
  })

  it('renders placeholders for empty fields', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    /** Check that placeholders are set correctly */
    expect(codeInputs[0]?.props('placeholder')).toBe('Name')
    expect(codeInputs[1]?.props('placeholder')).toBe('Value')
    expect(codeInputs[2]?.props('placeholder')).toBe('Domain')
  })

  it('handles edge case with only empty row in data', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [{ name: '', value: '', domain: '', isDisabled: false }],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents(DataTableRow)
    /** Should only render header + the existing empty row (no additional empty row) */
    expect(rows.length).toBe(2)
  })

  it('handles partially filled last row', () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [{ name: 'partial', value: '', domain: '', isDisabled: false }],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const rows = wrapper.findAllComponents(DataTableRow)
    /** Should add an empty row because the last row has a name */
    expect(rows.length).toBe(3)
  })

  it('updates multiple fields in the same row', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })

    /** Update name */
    await codeInputs[0]?.vm.$emit('update:modelValue', 'new_name')
    /** Update value */
    await codeInputs[1]?.vm.$emit('update:modelValue', 'new_value')
    /** Update domain */
    await codeInputs[2]?.vm.$emit('update:modelValue', 'new_domain')

    expect(wrapper.emitted('updateRow')).toBeTruthy()
    expect(wrapper.emitted('updateRow')?.length).toBe(3)
  })

  it('handles delete operations on different rows', async () => {
    const wrapper = mount(CookiesTable, {
      props: {
        data: [
          {
            name: 'cookie1',
            value: 'value1',
            domain: '.example.com',
            isDisabled: false,
          },
          {
            name: 'cookie2',
            value: 'value2',
            domain: '.test.com',
            isDisabled: false,
          },
        ],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButtons = wrapper.findAllComponents({ name: 'ScalarButton' })

    /** Delete second row */
    await deleteButtons[1]?.vm.$emit('click')

    expect(wrapper.emitted('deleteRow')).toBeTruthy()
    expect(wrapper.emitted('deleteRow')?.[0]).toEqual([1])
  })
})
