// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Environments from './Environments.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

const mockEnvironment = {
  uid: '' as any,
  name: '',
  value: '',
  color: '',
}

const mockEnvironments = [
  {
    name: 'Production',
    color: '#FF0000',
    variables: [
      { name: 'API_URL', value: 'https://api.production.com' },
      { name: 'API_KEY', value: 'prod-key-123' },
    ],
  },
  {
    name: 'Development',
    color: '#00FF00',
    variables: [
      { name: 'API_URL', value: 'https://api.dev.com' },
      { name: 'API_KEY', value: 'dev-key-456' },
    ],
  },
]

describe('Environments', () => {
  it('renders the ViewLayout component', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const viewLayout = wrapper.findComponent({ name: 'ViewLayout' })
    expect(viewLayout.exists()).toBe(true)
  })

  it('renders the EnvironmentsSidebar component', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'EnvironmentsSidebar' })
    expect(sidebar.exists()).toBe(true)
  })

  it('passes correct props to EnvironmentsSidebar', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: ['My API', 'Other API'],
        environments: [],
        sidebarWidth: 400,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'EnvironmentsSidebar' })
    expect(sidebar.props('documentName')).toBe('My API')
    expect(sidebar.props('documents')).toEqual(['My API', 'Other API'])
    expect(sidebar.props('title')).toBe('Manage Environments')
    expect(sidebar.props('width')).toBe(400)
  })

  it('renders the "Environment Variables" heading when documentName is null', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Environment Variables')
  })

  it('renders the environment description text', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Set environment variables at your collection level')
    expect(wrapper.text()).toContain('{{ variable }}')
  })

  it('renders Environment for each environment', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    expect(wrappers).toHaveLength(2)
  })

  it('passes correct props to Environment', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    expect(wrappers[0]?.props('name')).toBe('Production')
    expect(wrappers[0]?.props('color')).toBe('#FF0000')
    expect(wrappers[0]?.props('isReadonly')).toBe(false)

    expect(wrappers[1]?.props('name')).toBe('Development')
    expect(wrappers[1]?.props('color')).toBe('#00FF00')
    expect(wrappers[1]?.props('isReadonly')).toBe(false)
  })

  it('sets isReadonly to true when documentName is null', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    expect(wrappers[0]?.props('isReadonly')).toBe(true)
    expect(wrappers[1]?.props('isReadonly')).toBe(true)
  })

  it('renders EnvironmentVariablesTable inside each wrapper', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })
    expect(tables).toHaveLength(2)
  })

  it('passes correct data to EnvironmentVariablesTable', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })
    expect(tables[0]?.props('data')).toEqual(mockEnvironments[0]?.variables)
    expect(tables[1]?.props('data')).toEqual(mockEnvironments[1]?.variables)
  })

  it('shows "Add Environment" button when documentName is not null', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Add Environment')
  })

  it('hides "Add Environment" button when documentName is null', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).not.toContain('Add Environment')
  })

  it('emits navigation:update:selection when EnvironmentsSidebar emits update:selection', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: ['API 1'],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'EnvironmentsSidebar' })
    await sidebar.vm.$emit('update:selection', 'API 1')

    expect(wrapper.emitted('navigation:update:selection')).toBeTruthy()
    expect(wrapper.emitted('navigation:update:selection')?.[0]).toEqual(['API 1'])
  })

  it('emits navigation:update:sidebarWidth when EnvironmentsSidebar emits update:width', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: null,
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'EnvironmentsSidebar' })
    await sidebar.vm.$emit('update:width', 350)

    expect(wrapper.emitted('navigation:update:sidebarWidth')).toBeTruthy()
    expect(wrapper.emitted('navigation:update:sidebarWidth')?.[0]).toEqual([350])
  })

  it('emits environment:add:variable when EnvironmentVariablesTable emits addRow', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })
    await tables[0]?.vm.$emit('addRow', {
      name: 'NEW_VAR',
      value: 'new-value',
    })

    expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
    expect(wrapper.emitted('environment:add:variable')?.[0]).toEqual([
      {
        'environmentName': 'Production',
        environmentVariable: {
          name: 'NEW_VAR',
          value: 'new-value',
        },
      },
    ])
  })

  it('emits environment:update:variable when EnvironmentVariablesTable emits updateRow', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })
    await tables[0]?.vm.$emit('updateRow', 0, {
      name: 'UPDATED_VAR',
      value: 'updated-value',
    })

    expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
    expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([
      {
        id: 0,
        environmentName: 'Production',
        environmentVariable: {
          name: 'UPDATED_VAR',
          value: 'updated-value',
        },
      },
    ])
  })

  it('emits environment:delete:variable when EnvironmentVariablesTable emits deleteRow', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })
    await tables[0]?.vm.$emit('deleteRow', 1)

    expect(wrapper.emitted('environment:delete:variable')).toBeTruthy()
    expect(wrapper.emitted('environment:delete:variable')?.[0]).toEqual([
      {
        environmentName: 'Production',
        id: 1,
      },
    ])
  })

  it('emits environment:reorder when Environment emits reorder', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    const draggingItem = { id: 'env-1' }
    const hoveredItem = { id: 'env-2' }

    await wrappers[0]?.vm.$emit('reorder', draggingItem, hoveredItem)

    expect(wrapper.emitted('environment:reorder')).toBeTruthy()
    expect(wrapper.emitted('environment:reorder')?.[0]).toEqual([
      {
        draggingItem,
        hoveredItem,
      },
    ])
  })

  it('renders EnvironmentCreateModal', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const modal = wrapper.findComponent({ name: 'EnvironmentCreateModal' })
    expect(modal.exists()).toBe(true)
  })

  it('emits environment:add when EnvironmentCreateModal emits submit', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const modal = wrapper.findComponent({ name: 'EnvironmentCreateModal' })
    await modal.vm.$emit('submit', {
      name: 'Staging',
      color: '#0000FF',
    })

    expect(wrapper.emitted('environment:add')).toBeTruthy()
    expect(wrapper.emitted('environment:add')?.[0]).toEqual([
      {
        environment: {
          name: 'Staging',
          color: '#0000FF',
          variables: [],
        },
      },
    ])
  })

  it('does not render EnvironmentDeleteModal by default', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const modal = wrapper.findComponent({ name: 'EnvironmentDeleteModal' })
    expect(modal.exists()).toBe(false)
  })

  it('renders EnvironmentDeleteModal after clicking delete on a table wrapper', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    await wrappers[0]?.vm.$emit('delete')

    await wrapper.vm.$nextTick()

    const modal = wrapper.findComponent({ name: 'EnvironmentDeleteModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('name')).toBe('Production')
  })

  it('emits environment:delete when EnvironmentDeleteModal emits submit', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    await wrappers[0]?.vm.$emit('delete')
    await wrapper.vm.$nextTick()

    const modal = wrapper.findComponent({ name: 'EnvironmentDeleteModal' })
    await modal.vm.$emit('submit')

    expect(wrapper.emitted('environment:delete')).toBeTruthy()
    expect(wrapper.emitted('environment:delete')?.[0]).toEqual([
      {
        environmentName: 'Production',
      },
    ])
  })

  it('renders EnvironmentNameUpdateModal after clicking edit name on a table wrapper', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    await wrappers[0]?.vm.$emit('update:name')
    await wrapper.vm.$nextTick()

    const modal = wrapper.findComponent({ name: 'EnvironmentNameUpdateModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('name')).toBe('Production')
  })

  it('emits environment:update when EnvironmentNameUpdateModal emits submit', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    await wrappers[0]?.vm.$emit('update:name')
    await wrapper.vm.$nextTick()

    const modal = wrapper.findComponent({ name: 'EnvironmentNameUpdateModal' })
    await modal.vm.$emit('submit', { name: 'Production Updated' })

    expect(wrapper.emitted('environment:update')).toBeTruthy()
    expect(wrapper.emitted('environment:update')?.[0]).toEqual([
      {
        environmentName: 'Production',
        environment: {
          name: 'Production Updated',
        },
      },
    ])
  })

  it('renders EnvironmentColorUpdateModal after clicking edit color on a table wrapper', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    await wrappers[0]?.vm.$emit('update:color')
    await wrapper.vm.$nextTick()

    const modal = wrapper.findComponent({
      name: 'EnvironmentColorUpdateModal',
    })
    expect(modal.exists()).toBe(true)
    expect(modal.props('color')).toBe('#FF0000')
  })

  it('uses default white color when environment has no color', async () => {
    const envWithoutColor = [
      {
        name: 'No Color Env',
        variables: [],
      },
    ]

    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: envWithoutColor,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    await wrappers[0]?.vm.$emit('update:color')
    await wrapper.vm.$nextTick()

    const modal = wrapper.findComponent({
      name: 'EnvironmentColorUpdateModal',
    })
    expect(modal.props('color')).toBe('#FFFFFF')
  })

  it('handles empty environments array', () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })
    expect(wrappers).toHaveLength(0)
    expect(wrapper.text()).toContain('Add Environment')
  })

  it('handles multiple variable updates for different environments', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })

    /** Update variable in first environment */
    await tables[0]?.vm.$emit('updateRow', 0, {
      name: 'VAR_1',
      value: 'value-1',
    })

    /** Update variable in second environment */
    await tables[1]?.vm.$emit('updateRow', 1, {
      name: 'VAR_2',
      value: 'value-2',
    })

    expect(wrapper.emitted('environment:update:variable')).toHaveLength(2)
    expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([
      {
        id: 0,
        environmentName: 'Production',
        environmentVariable: { name: 'VAR_1', value: 'value-1' },
      },
    ])
    expect(wrapper.emitted('environment:update:variable')?.[1]).toEqual([
      {
        id: 1,
        environmentName: 'Development',
        environmentVariable: { name: 'VAR_2', value: 'value-2' },
      },
    ])
  })

  it('handles editing different environments sequentially', async () => {
    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const wrappers = wrapper.findAllComponents({
      name: 'Environment',
    })

    /** Edit first environment */
    await wrappers[0]?.vm.$emit('update:name')
    await wrapper.vm.$nextTick()
    let modal = wrapper.findComponent({ name: 'EnvironmentNameUpdateModal' })
    expect(modal.props('name')).toBe('Production')

    /** Edit second environment */
    await wrappers[1]?.vm.$emit('update:name')
    await wrapper.vm.$nextTick()
    modal = wrapper.findComponent({ name: 'EnvironmentNameUpdateModal' })
    expect(modal.props('name')).toBe('Development')
  })

  it('passes envVariables and environment to all EnvironmentVariablesTable components', () => {
    const mockEnvVariables = [
      { name: 'VAR_1', value: 'value-1' },
      { name: 'VAR_2', value: 'value-2' },
    ]

    const wrapper = mount(Environments, {
      props: {
        documentName: 'My API',
        documents: [],
        environments: mockEnvironments,
        environment: mockEnvironment,
        envVariables: mockEnvVariables as any,
      },
    })

    const tables = wrapper.findAllComponents({
      name: 'EnvironmentVariablesTable',
    })

    tables.forEach((table) => {
      expect(table.props('envVariables')).toEqual(mockEnvVariables)
      expect(table.props('environment')).toEqual(mockEnvironment)
    })
  })
})
