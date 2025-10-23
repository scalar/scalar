// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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

const mountWithProps = (
  custom: Partial<{
    documentName: string | null
    documents: string[]
    environments: any[]
    sidebarWidth: number
  }> = {},
) => {
  const defaultProps = {
    documentName: null,
    documents: [],
    environments: [],
    sidebarWidth: undefined,
    environment: mockEnvironment,
    envVariables: [],
  }

  return mount(Environments, {
    props: {
      ...defaultProps,
      ...custom,
    },
  })
}

describe('Environments', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the ViewLayout component', () => {
      const wrapper = mountWithProps()

      const viewLayout = wrapper.findComponent({ name: 'ViewLayout' })
      expect(viewLayout.exists()).toBe(true)
    })

    it('renders the "Environment Variables" heading', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Environment Variables')
    })

    it('renders the environment description text', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Set environment variables at your collection level')
      expect(wrapper.text()).toContain('{{ variable }}')
    })

    it('renders ScalarIconBracketsCurly by default', () => {
      const wrapper = mountWithProps()

      const icon = wrapper.findComponent({ name: 'ScalarIconBracketsCurly' })
      expect(icon.exists()).toBe(true)
    })

    it('renders EnvironmentsList component', () => {
      const wrapper = mountWithProps()

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.exists()).toBe(true)
    })
  })

  describe('EnvironmentsList component', () => {
    it('passes correct props to EnvironmentsList', () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('documentName')).toBe('My API')
      expect(environmentsList.props('environments')).toEqual(mockEnvironments)
      expect(environmentsList.props('environment')).toEqual(mockEnvironment)
      expect(environmentsList.props('envVariables')).toEqual([])
    })

    it('passes null documentName to EnvironmentsList', () => {
      const wrapper = mountWithProps({ documentName: null })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('documentName')).toBe(null)
    })

    it('passes empty environments array to EnvironmentsList', () => {
      const wrapper = mountWithProps({ environments: [] })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      expect(environmentsList.props('environments')).toEqual([])
    })
  })

  describe('environment events', () => {
    it('emits environment:reorder when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

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

    it('emits environment:add when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({ documentName: 'My API' })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = { environment: { name: 'Staging', color: '#0000FF' } }
      await environmentsList.vm.$emit('environment:add', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add')).toBeTruthy()
      expect(wrapper.emitted('environment:add')?.[0]).toEqual([payload])
    })

    it('emits environment:update when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Production',
        environment: { name: 'Production Updated' },
      }
      await environmentsList.vm.$emit('environment:update', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update')).toBeTruthy()
      expect(wrapper.emitted('environment:update')?.[0]).toEqual([payload])
    })

    it('emits environment:delete when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = { environmentName: 'Production' }
      await environmentsList.vm.$emit('environment:delete', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete')).toBeTruthy()
      expect(wrapper.emitted('environment:delete')?.[0]).toEqual([payload])
    })
  })

  describe('environment variable events', () => {
    it('emits environment:add:variable when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        environmentName: 'Production',
        environmentVariable: { name: 'NEW_VAR', value: 'new-value' },
      }
      await environmentsList.vm.$emit('environment:add:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:add:variable')?.[0]).toEqual([payload])
    })

    it('emits environment:update:variable when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = {
        id: 0,
        environmentName: 'Production',
        environmentVariable: { name: 'UPDATED_VAR', value: 'updated-value' },
      }
      await environmentsList.vm.$emit('environment:update:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([payload])
    })

    it('emits environment:delete:variable when EnvironmentsList emits it', async () => {
      const wrapper = mountWithProps({
        documentName: 'My API',
        environments: mockEnvironments,
      })

      const environmentsList = wrapper.findComponent({ name: 'EnvironmentsList' })
      const payload = { environmentName: 'Production', id: 1 }
      await environmentsList.vm.$emit('environment:delete:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:delete:variable')?.[0]).toEqual([payload])
    })
  })
})
