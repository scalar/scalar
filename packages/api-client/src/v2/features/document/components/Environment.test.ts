// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Environment from './Environment.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('Environment', () => {
  const baseEnvironment = {
    uid: 'env-1',
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const baseEnvironments = [
    {
      name: 'Development',
      color: '#3B82F6',
      isDefault: false,
      variables: [
        {
          id: 1,
          key: 'API_URL',
          value: 'https://dev.api.example.com',
          enabled: true,
        },
        {
          id: 2,
          key: 'API_KEY',
          value: 'dev-key-123',
          enabled: true,
        },
      ],
    },
    {
      name: 'Production',
      color: '#10B981',
      isDefault: true,
      variables: [
        {
          id: 1,
          key: 'API_URL',
          value: 'https://api.example.com',
          enabled: true,
        },
        {
          id: 2,
          key: 'API_KEY',
          value: 'prod-key-456',
          enabled: true,
        },
      ],
    },
  ]

  const baseEnvVariables = [
    { key: 'API_URL', value: 'https://dev.api.example.com' },
    { key: 'API_KEY', value: 'dev-key-123' },
  ]

  const mountWithProps = (
    custom: Partial<{
      documentName: string | null
      environments: any[]
      environment: any
      envVariables: any[]
    }> = {},
  ) => {
    const documentName = 'documentName' in custom ? custom.documentName : 'Test Document'
    const environments = custom.environments ?? baseEnvironments
    const environment = custom.environment ?? baseEnvironment
    const envVariables = custom.envVariables ?? baseEnvVariables

    return mount(Environment, {
      props: {
        documentName: documentName ?? null,
        environments,
        environment,
        envVariables,
      },
    })
  }

  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the title "Environment Variables"', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Environment Variables')
    })

    it('renders the description text about environment variables', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Set environment variables at your collection level')
      expect(wrapper.text()).toContain("to add / search among the selected environment's variables")
    })

    it('renders the EnvironmentsList component', () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.exists()).toBe(true)
    })
  })

  describe('EnvironmentsList props', () => {
    it('passes all required props to EnvironmentsList', () => {
      const documentName = 'Test Document'
      const wrapper = mountWithProps({ documentName })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const props = environmentsList.props()

      expect(props.documentName).toBe(documentName)
      expect(props.environments).toEqual(baseEnvironments)
      expect(props.environment).toEqual(baseEnvironment)
      expect(props.envVariables).toEqual(baseEnvVariables)
    })

    it('passes null documentName to EnvironmentsList for workspace level', () => {
      const wrapper = mountWithProps({ documentName: null })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('documentName')).toBe(null)
    })

    it('passes empty environments array to EnvironmentsList', () => {
      const wrapper = mountWithProps({ environments: [] })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('environments')).toEqual([])
    })

    it('passes custom environment to EnvironmentsList', () => {
      const customEnvironment = {
        uid: 'custom-env',
        name: 'Custom Environment',
        color: '#FF5733',
        value: 'custom',
        isDefault: false,
      }
      const wrapper = mountWithProps({ environment: customEnvironment })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('environment')).toEqual(customEnvironment)
    })

    it('passes empty envVariables array to EnvironmentsList', () => {
      const wrapper = mountWithProps({ envVariables: [] })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('envVariables')).toEqual([])
    })

    it('passes multiple environments to EnvironmentsList', () => {
      const multipleEnvironments = [
        { name: 'Dev', color: '#3B82F6', isDefault: false, variables: [] },
        { name: 'Staging', color: '#F59E0B', isDefault: false, variables: [] },
        { name: 'Production', color: '#10B981', isDefault: true, variables: [] },
      ]
      const wrapper = mountWithProps({ environments: multipleEnvironments })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('environments')).toEqual(multipleEnvironments)
    })
  })

  describe('environment event forwarding', () => {
    it('forwards environment:reorder event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        draggingItem: { id: 'env-1' },
        hoveredItem: { id: 'env-2' },
      }

      await environmentsList.vm.$emit('environment:reorder', payload)
      await nextTick()

      expect(wrapper.emitted('environment:reorder')).toBeTruthy()
      expect(wrapper.emitted('environment:reorder')?.[0]).toEqual([payload])
    })

    it('forwards environment:add event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environment: {
          name: 'New Environment',
          color: '#6366F1',
          isDefault: false,
          variables: [],
        },
      }

      await environmentsList.vm.$emit('environment:add', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add')).toBeTruthy()
      expect(wrapper.emitted('environment:add')?.[0]).toEqual([payload])
    })

    it('forwards environment:update event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Development',
        environment: {
          name: 'Development Updated',
          color: '#8B5CF6',
        },
      }

      await environmentsList.vm.$emit('environment:update', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update')).toBeTruthy()
      expect(wrapper.emitted('environment:update')?.[0]).toEqual([payload])
    })

    it('forwards environment:delete event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Development',
      }

      await environmentsList.vm.$emit('environment:delete', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete')).toBeTruthy()
      expect(wrapper.emitted('environment:delete')?.[0]).toEqual([payload])
    })
  })

  describe('environment variable event forwarding', () => {
    it('forwards environment:add:variable event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Development',
        environmentVariable: {
          key: 'NEW_VAR',
          value: 'new-value',
          enabled: true,
        },
      }

      await environmentsList.vm.$emit('environment:add:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:add:variable')?.[0]).toEqual([payload])
    })

    it('forwards environment:update:variable event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        id: 1,
        environmentName: 'Development',
        environmentVariable: {
          key: 'API_URL',
          value: 'https://updated.api.example.com',
          enabled: false,
        },
      }

      await environmentsList.vm.$emit('environment:update:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([payload])
    })

    it('forwards environment:delete:variable event from EnvironmentsList', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Development',
        id: 2,
      }

      await environmentsList.vm.$emit('environment:delete:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:delete:variable')?.[0]).toEqual([payload])
    })
  })

  describe('multiple event emissions', () => {
    it('emits multiple environment events in sequence', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })

      await environmentsList.vm.$emit('environment:add', {
        environment: { name: 'Test1', color: '#000000', isDefault: false, variables: [] },
      })
      await nextTick()

      await environmentsList.vm.$emit('environment:update', {
        environmentName: 'Test1',
        environment: { name: 'Test1 Updated' },
      })
      await nextTick()

      await environmentsList.vm.$emit('environment:delete', {
        environmentName: 'Test1 Updated',
      })
      await nextTick()

      expect(wrapper.emitted('environment:add')).toHaveLength(1)
      expect(wrapper.emitted('environment:update')).toHaveLength(1)
      expect(wrapper.emitted('environment:delete')).toHaveLength(1)
    })

    it('handles multiple variable events independently', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })

      await environmentsList.vm.$emit('environment:add:variable', {
        environmentName: 'Development',
        environmentVariable: { key: 'VAR1', value: 'value1' },
      })

      await environmentsList.vm.$emit('environment:update:variable', {
        id: 1,
        environmentName: 'Development',
        environmentVariable: { key: 'VAR1', value: 'updated-value1' },
      })

      await environmentsList.vm.$emit('environment:delete:variable', {
        environmentName: 'Development',
        id: 1,
      })

      expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:delete:variable')).toBeTruthy()
    })

    it('handles mixed environment and variable events', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })

      await environmentsList.vm.$emit('environment:add', {
        environment: { name: 'Test', color: '#000000', isDefault: false, variables: [] },
      })

      await environmentsList.vm.$emit('environment:add:variable', {
        environmentName: 'Test',
        environmentVariable: { key: 'VAR', value: 'val' },
      })

      await environmentsList.vm.$emit('environment:reorder', {
        draggingItem: { id: 'env-1' },
        hoveredItem: { id: 'env-2' },
      })

      expect(wrapper.emitted('environment:add')).toBeTruthy()
      expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:reorder')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('handles null documentName for workspace level environments', () => {
      const wrapper = mountWithProps({ documentName: null })

      expect(wrapper.exists()).toBe(true)
      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('documentName')).toBe(null)
    })

    it('handles empty environments array gracefully', () => {
      const wrapper = mountWithProps({ environments: [] })

      expect(wrapper.exists()).toBe(true)
      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('environments')).toEqual([])
    })

    it('handles environments without variables', () => {
      const environmentsWithoutVariables = [
        {
          name: 'Empty',
          color: '#000000',
          isDefault: true,
          variables: [],
        },
      ]
      const wrapper = mountWithProps({ environments: environmentsWithoutVariables })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('environments')).toEqual(environmentsWithoutVariables)
    })

    it('handles environment variable updates with partial data', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        id: 1,
        environmentName: 'Development',
        environmentVariable: {
          enabled: false,
        },
      }

      await environmentsList.vm.$emit('environment:update:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([payload])
    })

    it('handles environment updates with partial environment data', async () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Development',
        environment: {
          color: '#FF0000',
        },
      }

      await environmentsList.vm.$emit('environment:update', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update')).toBeTruthy()
      expect(wrapper.emitted('environment:update')?.[0]).toEqual([payload])
    })
  })
})
