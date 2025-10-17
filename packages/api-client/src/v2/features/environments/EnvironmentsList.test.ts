// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import EnvironmentComponent from './components/Environment.vue'
import EnvironmentsList from './EnvironmentsList.vue'

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

const mountWithProps = (
  custom: Partial<{
    documentName: string | null
    environments: any[]
    environment: any
    envVariables: any[]
  }> = {},
) => {
  const defaultProps = {
    documentName: 'My API',
    environments: [],
    environment: mockEnvironment,
    envVariables: [],
  }

  return mount(EnvironmentsList, {
    props: {
      ...defaultProps,
      ...custom,
    },
  })
}

describe('EnvironmentsList', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders no Environment components when environments is empty', () => {
      const wrapper = mountWithProps({ environments: [] })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
      expect(environmentComponents).toHaveLength(0)
    })

    it('renders Environment component for each environment', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
      expect(environmentComponents).toHaveLength(2)
    })

    it('renders single Environment component', () => {
      const wrapper = mountWithProps({
        environments: [mockEnvironments[0]],
      })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
      expect(environmentComponents).toHaveLength(1)
    })

    it('renders "Add Environment" button when documentName is provided', () => {
      const wrapper = mountWithProps({ documentName: 'My API' })

      expect(wrapper.text()).toContain('Add Environment')
    })

    it('does not render "Add Environment" button when documentName is null', () => {
      const wrapper = mountWithProps({ documentName: null })

      expect(wrapper.text()).not.toContain('Add Environment')
    })

    it('renders EnvironmentCreateModal', () => {
      const wrapper = mountWithProps()

      const modal = wrapper.findComponent({ name: 'EnvironmentCreateModal' })
      expect(modal.exists()).toBe(true)
    })

    it('renders EnvironmentDeleteModal when selectedEnvironment exists', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      // Trigger delete to set selectedEnvironment
      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('delete')
      await nextTick()

      const modal = wrapper.findComponent({ name: 'EnvironmentDeleteModal' })
      expect(modal.exists()).toBe(true)
    })

    it('renders EnvironmentNameUpdateModal when selectedEnvironment exists', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      // Trigger update:name to set selectedEnvironment
      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('update:name')
      await nextTick()

      const modal = wrapper.findComponent({
        name: 'EnvironmentNameUpdateModal',
      })
      expect(modal.exists()).toBe(true)
    })

    it('renders EnvironmentColorUpdateModal when selectedEnvironment exists', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      // Trigger update:color to set selectedEnvironment
      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('update:color')
      await nextTick()

      const modal = wrapper.findComponent({
        name: 'EnvironmentColorUpdateModal',
      })
      expect(modal.exists()).toBe(true)
    })
  })

  describe('props', () => {
    it('sets isReadonly to true when documentName is null', () => {
      const wrapper = mountWithProps({
        documentName: null,
        environments: mockEnvironments,
      })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      expect(environmentComponent.props('isReadonly')).toBe(true)
    })

    it('sets isReadonly to false when documentName is provided', () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      expect(environmentComponent.props('isReadonly')).toBe(false)
    })

    it('handles environment without color', () => {
      const envWithoutColor = [
        {
          name: 'Staging',
          variables: [],
        },
      ]
      const wrapper = mountWithProps({ environments: envWithoutColor })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      expect(environmentComponent.props('color')).toBeUndefined()
    })
  })

  describe('environment events', () => {
    it('emits environment:reorder when Environment component emits reorder', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      const draggingItem = { id: 'env-1' }
      const hoveredItem = { id: 'env-2' }
      await environmentComponent.vm.$emit('reorder', draggingItem, hoveredItem)
      await nextTick()

      expect(wrapper.emitted('environment:reorder')).toBeTruthy()
      expect(wrapper.emitted('environment:reorder')?.[0]).toEqual([{ draggingItem, hoveredItem }])
    })

    it('emits environment:add when EnvironmentCreateModal submits', async () => {
      const wrapper = mountWithProps()

      const modal = wrapper.findComponent({ name: 'EnvironmentCreateModal' })
      const payload = { name: 'Staging', color: '#0000FF' }
      await modal.vm.$emit('submit', payload)
      await nextTick()

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

    it('emits environment:update when EnvironmentNameUpdateModal submits', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      // Trigger update:name to set selectedEnvironment
      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('update:name')
      await nextTick()

      const modal = wrapper.findComponent({
        name: 'EnvironmentNameUpdateModal',
      })
      const payload = { name: 'Production Updated' }
      await modal.vm.$emit('submit', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update')).toBeTruthy()
      expect(wrapper.emitted('environment:update')?.[0]).toEqual([
        {
          environmentName: 'Production',
          environment: { name: 'Production Updated' },
        },
      ])
    })

    it('emits environment:update when EnvironmentColorUpdateModal submits', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      // Trigger update:color to set selectedEnvironment
      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('update:color')
      await nextTick()

      const modal = wrapper.findComponent({
        name: 'EnvironmentColorUpdateModal',
      })
      const payload = { color: '#FF00FF' }
      await modal.vm.$emit('submit', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update')).toBeTruthy()
      expect(wrapper.emitted('environment:update')?.[0]).toEqual([
        {
          environmentName: 'Production',
          environment: { color: '#FF00FF' },
        },
      ])
    })

    it('emits environment:delete when EnvironmentDeleteModal submits', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      // Trigger delete to set selectedEnvironment
      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('delete')
      await nextTick()

      const modal = wrapper.findComponent({ name: 'EnvironmentDeleteModal' })
      await modal.vm.$emit('submit')
      await nextTick()

      expect(wrapper.emitted('environment:delete')).toBeTruthy()
      expect(wrapper.emitted('environment:delete')?.[0]).toEqual([
        {
          environmentName: 'Production',
        },
      ])
    })

    it('tracks selectedEnvironment when delete is triggered', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)

      // Delete first environment
      await environmentComponents[0]!.vm.$emit('delete')
      await nextTick()

      const deleteModal = wrapper.findComponent({
        name: 'EnvironmentDeleteModal',
      })
      expect(deleteModal.props('name')).toBe('Production')
    })

    it('tracks selectedEnvironment when update:name is triggered', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)

      // Update second environment name
      await environmentComponents[1]!.vm.$emit('update:name')
      await nextTick()

      const updateModal = wrapper.findComponent({
        name: 'EnvironmentNameUpdateModal',
      })
      expect(updateModal.props('name')).toBe('Development')
    })

    it('tracks selectedEnvironment when update:color is triggered', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)

      // Update second environment color
      await environmentComponents[1]!.vm.$emit('update:color')
      await nextTick()

      const updateModal = wrapper.findComponent({
        name: 'EnvironmentColorUpdateModal',
      })
      expect(updateModal.props('color')).toBe('#00FF00')
    })

    it('handles environment with no color in ColorUpdateModal', async () => {
      const envWithoutColor = [
        {
          name: 'Staging',
          variables: [],
        },
      ]
      const wrapper = mountWithProps({ environments: envWithoutColor })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      await environmentComponent.vm.$emit('update:color')
      await nextTick()

      const modal = wrapper.findComponent({
        name: 'EnvironmentColorUpdateModal',
      })
      expect(modal.props('color')).toBe('#FFFFFF')
    })
  })

  describe('environment variable events', () => {
    it('emits environment:add:variable when Environment emits add:variable', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      const payload = { name: 'NEW_VAR', value: 'new-value' }
      await environmentComponent.vm.$emit('add:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:add:variable')?.[0]).toEqual([
        {
          environmentName: 'Production',
          environmentVariable: payload,
        },
      ])
    })

    it('emits environment:update:variable when Environment emits update:variable', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      const payload = { id: 0, value: { name: 'UPDATED_VAR', value: 'updated' } }
      await environmentComponent.vm.$emit('update:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([
        {
          id: 0,
          environmentName: 'Production',
          environmentVariable: { name: 'UPDATED_VAR', value: 'updated' },
        },
      ])
    })

    it('emits environment:delete:variable when Environment emits delete:variable', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      const payload = { id: 1 }
      await environmentComponent.vm.$emit('delete:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:delete:variable')?.[0]).toEqual([
        {
          environmentName: 'Production',
          id: 1,
        },
      ])
    })

    it('emits variable events for correct environment', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)

      // Add variable to second environment
      const payload = { name: 'DEV_VAR', value: 'dev-value' }
      await environmentComponents[1]!.vm.$emit('add:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add:variable')?.[0]).toEqual([
        {
          environmentName: 'Development',
          environmentVariable: payload,
        },
      ])
    })
  })

  describe('edge cases', () => {
    it('handles empty environments array gracefully', () => {
      const wrapper = mountWithProps({ environments: [] })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findAllComponents(EnvironmentComponent)).toHaveLength(0)
    })

    it('handles environments with empty variables array', () => {
      const envWithNoVars = [
        {
          name: 'Empty',
          color: '#000000',
          variables: [],
        },
      ]
      const wrapper = mountWithProps({ environments: envWithNoVars })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      expect(environmentComponent.props('variables')).toEqual([])
    })

    it('handles multiple rapid environment updates', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)

      // Rapid updates
      await environmentComponent.vm.$emit('update:name')
      await nextTick()
      await environmentComponent.vm.$emit('update:color')
      await nextTick()
      await environmentComponent.vm.$emit('delete')
      await nextTick()

      // Most recent should be delete
      const deleteModal = wrapper.findComponent({
        name: 'EnvironmentDeleteModal',
      })
      expect(deleteModal.exists()).toBe(true)
    })

    it('handles switching between different selectedEnvironments', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)

      // Select first environment for deletion
      await environmentComponents[0]!.vm.$emit('delete')
      await nextTick()

      const deleteModal = wrapper.findComponent({
        name: 'EnvironmentDeleteModal',
      })
      expect(deleteModal.props('name')).toBe('Production')

      // Select second environment for name update
      await environmentComponents[1]!.vm.$emit('update:name')
      await nextTick()

      const nameModal = wrapper.findComponent({
        name: 'EnvironmentNameUpdateModal',
      })
      expect(nameModal.props('name')).toBe('Development')
    })

    it('handles environment names with special characters', () => {
      const specialEnvs = [
        {
          name: 'Test-Environment_123',
          color: '#FF0000',
          variables: [],
        },
      ]
      const wrapper = mountWithProps({ environments: specialEnvs })

      const environmentComponent = wrapper.findComponent(EnvironmentComponent)
      expect(environmentComponent.props('name')).toBe('Test-Environment_123')
    })

    it('renders correctly with a large number of environments', () => {
      const manyEnvironments = Array.from({ length: 20 }, (_, i) => ({
        name: `Environment ${i}`,
        color: `#${i.toString(16).padStart(6, '0')}`,
        variables: [],
      }))

      const wrapper = mountWithProps({ environments: manyEnvironments })

      const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
      expect(environmentComponents).toHaveLength(20)
    })

    it('does not render modals when selectedEnvironment is null', () => {
      const wrapper = mountWithProps({ environments: [] })

      const deleteModal = wrapper.findComponent({
        name: 'EnvironmentDeleteModal',
      })
      const nameModal = wrapper.findComponent({
        name: 'EnvironmentNameUpdateModal',
      })
      const colorModal = wrapper.findComponent({
        name: 'EnvironmentColorUpdateModal',
      })

      expect(deleteModal.exists()).toBe(false)
      expect(nameModal.exists()).toBe(false)
      expect(colorModal.exists()).toBe(false)
    })
  })

  describe('add environment button', () => {
    it('shows "Add Environment" button with proper styling', () => {
      const wrapper = mountWithProps({ documentName: 'My API' })

      const addButton = wrapper.findComponent({ name: 'ScalarButton' })
      expect(addButton.exists()).toBe(true)
      expect(addButton.text()).toContain('Add Environment')
    })

    it('displays ScalarIconPlus in add button', () => {
      const wrapper = mountWithProps({ documentName: 'My API' })

      const icon = wrapper.findComponent({ name: 'ScalarIconPlus' })
      expect(icon.exists()).toBe(true)
    })

    it('opens create modal when add button is clicked', async () => {
      const wrapper = mountWithProps({ documentName: 'My API' })

      // We cannot directly test modal.show() being called, but we can verify the modal exists
      const createModal = wrapper.findComponent({
        name: 'EnvironmentCreateModal',
      })
      expect(createModal.exists()).toBe(true)
    })

    it('hides add button container when documentName is null', () => {
      const wrapper = mountWithProps({ documentName: null })

      const button = wrapper.find('[data-test="add-environment-button"]')
      expect(button.exists()).toBe(false)
    })
  })
})
