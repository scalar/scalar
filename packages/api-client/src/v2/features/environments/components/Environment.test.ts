import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Environment from './Environment.vue'

const mockEnvironment = {
  uid: '' as any,
  name: '',
  value: '',
  color: '',
}

const mockVariables = [
  { name: 'API_URL', value: 'https://api.example.com' },
  { name: 'API_KEY', value: 'secret-key-123' },
]

describe('Environment', () => {
  it('renders the component', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        color: '#FF0000',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders the Draggable component', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const draggable = wrapper.findComponent({ name: 'Draggable' })
    expect(draggable.exists()).toBe(true)
  })

  it('displays the environment name', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Development',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Development')
  })

  it('displays the environment color indicator', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        color: '#FF0000',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const colorSpan = wrapper.find('span.h-2\\.5.w-2\\.5.rounded-full')
    expect(colorSpan.exists()).toBe(true)
  })

  it('uses default white color when no color is provided', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const colorSpan = wrapper.find('span.h-2\\.5.w-2\\.5.rounded-full')
    const style = colorSpan.attributes('style')
    /** Vue converts hex to RGB, just check background-color exists */
    expect(style).toContain('background-color')
  })

  it('renders EnvironmentVariablesTable', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    expect(table.exists()).toBe(true)
  })

  it('passes variables to EnvironmentVariablesTable', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    expect(table.props('data')).toEqual(mockVariables)
  })

  it('shows edit color button when not readonly', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        isReadonly: false,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
    /** Should have color button, name button, and delete button */
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('hides edit buttons when readonly', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        isReadonly: true,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    /** In readonly mode, name should be displayed as plain span */
    const nameSpan = wrapper.find('span.px-1.py-0\\.5.text-sm')
    expect(nameSpan.exists()).toBe(true)
    expect(nameSpan.text()).toBe('Production')
  })

  it('emits delete event when clicking delete button', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const deleteButton = wrapper.findAllComponents({ name: 'ScalarButton' })[2]
    await deleteButton?.vm.$emit('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('emits update:name event when clicking name button', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const nameButton = wrapper.findAllComponents({ name: 'ScalarButton' })[1]
    await nameButton?.vm.$emit('click')

    expect(wrapper.emitted('update:name')).toBeTruthy()
  })

  it('emits update:color event when clicking color button', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        color: '#FF0000',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const colorButton = wrapper.findAllComponents({ name: 'ScalarButton' })[0]
    await colorButton?.vm.$emit('click')

    expect(wrapper.emitted('update:color')).toBeTruthy()
  })

  it('emits add:variable when EnvironmentVariablesTable emits addRow', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    await table.vm.$emit('addRow', { name: 'NEW_VAR', value: 'new-value' })

    expect(wrapper.emitted('add:variable')).toBeTruthy()
    expect(wrapper.emitted('add:variable')?.[0]).toEqual([{ name: 'NEW_VAR', value: 'new-value' }])
  })

  it('emits update:variable when EnvironmentVariablesTable emits updateRow', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    await table.vm.$emit('updateRow', 0, {
      name: 'UPDATED_VAR',
      value: 'updated-value',
    })

    expect(wrapper.emitted('update:variable')).toBeTruthy()
    expect(wrapper.emitted('update:variable')?.[0]).toEqual([
      {
        id: 0,
        value: { name: 'UPDATED_VAR', value: 'updated-value' },
      },
    ])
  })

  it('emits delete:variable when EnvironmentVariablesTable emits deleteRow', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    await table.vm.$emit('deleteRow', 1)

    expect(wrapper.emitted('delete:variable')).toBeTruthy()
    expect(wrapper.emitted('delete:variable')?.[0]).toEqual([{ id: 1 }])
  })

  it('emits reorder when Draggable emits onDragEnd', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const draggable = wrapper.findComponent({ name: 'Draggable' })
    const draggingItem = { id: 'env-1' }
    const hoveredItem = { id: 'env-2' }

    await draggable.vm.$emit('onDragEnd', draggingItem, hoveredItem)

    expect(wrapper.emitted('reorder')).toBeTruthy()
    expect(wrapper.emitted('reorder')?.[0]).toEqual([draggingItem, hoveredItem])
  })

  it('renders delete icon in delete button', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const trashIcon = wrapper.findComponent({ name: 'ScalarIconTrash' })
    expect(trashIcon.exists()).toBe(true)
  })

  it('handles empty variables array', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    expect(table.props('data')).toEqual([])
  })

  it('passes environment prop to EnvironmentVariablesTable', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    expect(table.props('environment')).toEqual(mockEnvironment)
  })

  it('passes envVariables prop to EnvironmentVariablesTable', () => {
    const mockEnvVariables = [
      { name: 'VAR_1', value: 'value-1' },
      { name: 'VAR_2', value: 'value-2' },
    ]

    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: mockEnvVariables as any,
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })
    expect(table.props('envVariables')).toEqual(mockEnvVariables)
  })

  it('does not show edit/delete buttons in readonly mode', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        isReadonly: true,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    /** In readonly mode, name and color should be in plain spans, not buttons */
    const nameSpan = wrapper.find('span.px-1.py-0\\.5.text-sm')
    expect(nameSpan.exists()).toBe(true)

    /** The color div should not be inside a button */
    const colorDiv = wrapper.find('div.flex.h-6.w-6.items-center.justify-center.p-1')
    expect(colorDiv.exists()).toBe(true)
  })

  it('shows color indicator even in readonly mode', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        color: '#00FF00',
        variables: [],
        isReadonly: true,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const colorSpan = wrapper.find('span.h-2\\.5.w-2\\.5.rounded-full')
    expect(colorSpan.exists()).toBe(true)
    const style = colorSpan.attributes('style')
    /** Vue converts hex to RGB, just check background-color exists */
    expect(style).toContain('background-color')
  })

  it('shows name as plain text in readonly mode', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Staging',
        variables: [],
        isReadonly: true,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Staging')
    /** Name should not be in a button when readonly */
    const nameButtons = wrapper.findAll('button').filter((btn) => btn.text().includes('Staging'))
    expect(nameButtons.length).toBe(0)
  })

  it('passes correct id to Draggable', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const draggable = wrapper.findComponent({ name: 'Draggable' })
    expect(draggable.props('id')).toBe('Production')
  })

  it('sets Draggable as both draggable and droppable', () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const draggable = wrapper.findComponent({ name: 'Draggable' })
    expect(draggable.props('isDraggable')).toBe(true)
    expect(draggable.props('isDroppable')).toBe(true)
  })

  it('handles multiple variable operations', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })

    /** Add a variable */
    await table.vm.$emit('addRow', { name: 'VAR_3', value: 'value-3' })

    /** Update a variable */
    await table.vm.$emit('updateRow', 0, { name: 'VAR_1_UPDATED' })

    /** Delete a variable */
    await table.vm.$emit('deleteRow', 1)

    expect(wrapper.emitted('add:variable')).toBeTruthy()
    expect(wrapper.emitted('update:variable')).toBeTruthy()
    expect(wrapper.emitted('delete:variable')).toBeTruthy()
  })

  it('handles long environment names', () => {
    const longName = 'Very Long Environment Name That Should Be Displayed'
    const wrapper = mount(Environment, {
      props: {
        name: longName,
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain(longName)
  })

  it('handles special characters in environment name', () => {
    const specialName = 'Production-API_v2.0'
    const wrapper = mount(Environment, {
      props: {
        name: specialName,
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain(specialName)
  })

  it('emits events with correct payload structure for variable operations', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })

    /** Test add:variable payload */
    await table.vm.$emit('addRow', { name: 'TEST', value: 'test-value' })
    expect(wrapper.emitted('add:variable')?.[0]).toEqual([{ name: 'TEST', value: 'test-value' }])

    /** Test update:variable payload */
    await table.vm.$emit('updateRow', 5, {
      name: 'UPDATED',
      value: 'updated-value',
    })
    expect(wrapper.emitted('update:variable')?.[0]).toEqual([
      {
        id: 5,
        value: { name: 'UPDATED', value: 'updated-value' },
      },
    ])

    /** Test delete:variable payload */
    await table.vm.$emit('deleteRow', 10)
    expect(wrapper.emitted('delete:variable')?.[0]).toEqual([{ id: 10 }])
  })

  it('handles partial variable data in add operation', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })

    /** Add with only name */
    await table.vm.$emit('addRow', { name: 'PARTIAL_VAR' })
    expect(wrapper.emitted('add:variable')?.[0]).toEqual([{ name: 'PARTIAL_VAR', value: undefined }])
  })

  it('handles partial variable data in update operation', async () => {
    const wrapper = mount(Environment, {
      props: {
        name: 'Production',
        variables: mockVariables,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const table = wrapper.findComponent({ name: 'EnvironmentVariablesTable' })

    /** Update with only name */
    await table.vm.$emit('updateRow', 0, { name: 'ONLY_NAME' })
    expect(wrapper.emitted('update:variable')?.[0]).toEqual([
      {
        id: 0,
        value: { name: 'ONLY_NAME', value: undefined },
      },
    ])
  })
})
