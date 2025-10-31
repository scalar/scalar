import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Servers from './Servers.vue'

describe('Servers', () => {
  const mockEvents = {
    commandPalette: {
      emit: vi.fn(),
    },
  }

  const baseEnvironment = {
    uid: 'env-1' as any,
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const baseServers = [
    {
      url: 'https://api.example.com',
      description: 'Production API',
      variables: {
        version: {
          default: 'v1',
          description: 'API Version',
        },
      },
    },
    {
      url: 'https://dev.api.example.com',
      description: 'Development API',
      variables: {
        version: {
          default: 'v2',
          description: 'API Version',
        },
      },
    },
  ]

  const mountWithProps = (
    custom: Partial<{
      servers: any[]
      events: any
    }> = {},
  ) => {
    const servers = custom.servers ?? baseServers
    const events = custom.events ?? mockEvents

    return mount(Servers, {
      props: {
        servers,
        events,
        environment: baseEnvironment,
        envVariables: [],
      },
    })
  }

  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the title "Servers"', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Servers')
    })

    it('renders the description text', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Add different base URLs for your API')
      expect(wrapper.text()).toContain('{variables}')
    })

    it('renders the Add Server button', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Add Server')
    })

    it('renders server cards for each server', () => {
      const wrapper = mountWithProps()

      const serverCards = wrapper.findAll('.rounded-lg.border')
      expect(serverCards.length).toBeGreaterThan(0)
    })
  })

  describe('server cards', () => {
    it('renders server description when provided', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Production API')
      expect(wrapper.text()).toContain('Development API')
    })

    it('renders fallback "Server X" when description is missing', () => {
      const serversWithoutDescription = [
        {
          url: 'https://api.example.com',
          variables: {},
        },
        {
          url: 'https://dev.api.example.com',
          variables: {},
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithoutDescription })

      expect(wrapper.text()).toContain('Server 1')
      expect(wrapper.text()).toContain('Server 2')
    })

    it('renders ScalarMarkdown for server description', () => {
      const wrapper = mountWithProps()

      const markdown = wrapper.findAllComponents({ name: 'ScalarMarkdown' })
      expect(markdown.length).toBeGreaterThan(0)
    })

    it('renders delete button for each server', () => {
      const wrapper = mountWithProps()

      const deleteButtons = wrapper.findAllComponents({ name: 'ScalarIconTrash' })
      expect(deleteButtons.length).toBe(2)
    })

    it('renders Form component for each server', () => {
      const wrapper = mountWithProps()

      const forms = wrapper.findAllComponents({ name: 'Form' })
      expect(forms.length).toBe(2)
    })

    it('passes correct data to Form component', () => {
      const wrapper = mountWithProps()

      const forms = wrapper.findAllComponents({ name: 'Form' })
      expect(forms[0]?.props('data')).toEqual(baseServers[0])
      expect(forms[1]?.props('data')).toEqual(baseServers[1])
    })

    it('passes correct options to Form component', () => {
      const wrapper = mountWithProps()

      const form = wrapper.findComponent({ name: 'Form' })
      const options = form.props('options')

      expect(options).toHaveLength(2)
      expect(options[0].label).toBe('URL')
      expect(options[0].key).toBe('url')
      expect(options[1].label).toBe('Description')
      expect(options[1].key).toBe('description')
    })

    it('renders ServerVariablesForm when server has variables', () => {
      const wrapper = mountWithProps()

      const variablesForms = wrapper.findAllComponents({ name: 'ServerVariablesForm' })
      expect(variablesForms.length).toBe(2)
    })

    it('does not render ServerVariablesForm when server has no variables', () => {
      const serversWithoutVariables = [
        {
          url: 'https://api.example.com',
          description: 'Production API',
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithoutVariables })

      const variablesForms = wrapper.findAllComponents({ name: 'ServerVariablesForm' })
      expect(variablesForms.length).toBe(0)
    })

    it('passes correct variables to ServerVariablesForm', () => {
      const wrapper = mountWithProps()

      const variablesForms = wrapper.findAllComponents({ name: 'ServerVariablesForm' })
      expect(variablesForms[0]?.props('variables')).toEqual(baseServers[0]?.variables)
      expect(variablesForms[1]?.props('variables')).toEqual(baseServers[1]?.variables)
    })
  })

  describe('Add Server button', () => {
    it('emits command palette event when Add Server button is clicked', async () => {
      const mockEvents = {
        commandPalette: {
          emit: vi.fn(),
        },
      }
      const wrapper = mountWithProps({ events: mockEvents })

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('Add Server'))
      await addButton?.trigger('click')
      await nextTick()

      expect(mockEvents.commandPalette.emit).toHaveBeenCalledWith({ commandName: 'Add Server' })
    })

    it('renders ScalarIconPlus in Add Server button', () => {
      const wrapper = mountWithProps()

      const plusIcons = wrapper.findAllComponents({ name: 'ScalarIconPlus' })
      expect(plusIcons.length).toBeGreaterThan(0)
    })
  })

  describe('server:update:variable event from Form', () => {
    it('emits server:update:variable when Form onUpdate is called', async () => {
      const wrapper = mountWithProps()

      const form = wrapper.findComponent({ name: 'Form' })
      const onUpdate = form.props('onUpdate')

      onUpdate('url', 'https://new-api.example.com')
      await nextTick()

      expect(wrapper.emitted('server:update:variable')).toBeTruthy()
      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([
        {
          serverUrl: baseServers[0]?.url,
          name: 'url',
          value: 'https://new-api.example.com',
        },
      ])
    })

    it('emits server:update:variable with description update', async () => {
      const wrapper = mountWithProps()

      const form = wrapper.findComponent({ name: 'Form' })
      const onUpdate = form.props('onUpdate')

      onUpdate('description', 'Updated Description')
      await nextTick()

      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([
        {
          serverUrl: baseServers[0]?.url,
          name: 'description',
          value: 'Updated Description',
        },
      ])
    })

    it('emits server:update:variable for different servers', async () => {
      const wrapper = mountWithProps()

      const forms = wrapper.findAllComponents({ name: 'Form' })
      const onUpdate1 = forms[0]?.props('onUpdate')
      const onUpdate2 = forms[1]?.props('onUpdate')

      onUpdate1('url', 'https://server1.com')
      await nextTick()
      onUpdate2('url', 'https://server2.com')
      await nextTick()

      expect(wrapper.emitted('server:update:variable')).toHaveLength(2)
      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([
        {
          serverUrl: baseServers[0]?.url,
          name: 'url',
          value: 'https://server1.com',
        },
      ])
      expect(wrapper.emitted('server:update:variable')?.[1]).toEqual([
        {
          serverUrl: baseServers[1]?.url,
          name: 'url',
          value: 'https://server2.com',
        },
      ])
    })
  })

  describe('server:update:variable event from ServerVariablesForm', () => {
    it('emits server:update:variable when ServerVariablesForm emits update:variable', async () => {
      const wrapper = mountWithProps()

      const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
      await variablesForm.vm.$emit('update:variable', 'version', 'v3')
      await nextTick()

      expect(wrapper.emitted('server:update:variable')).toBeTruthy()
      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([
        {
          serverUrl: baseServers[0]?.url,
          name: 'version',
          value: 'v3',
        },
      ])
    })

    it('emits server:update:variable for different variable names', async () => {
      const wrapper = mountWithProps()

      const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
      await variablesForm.vm.$emit('update:variable', 'apiKey', 'new-key')
      await nextTick()

      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([
        {
          serverUrl: baseServers[0]?.url,
          name: 'apiKey',
          value: 'new-key',
        },
      ])
    })

    it('emits server:update:variable for different servers variables', async () => {
      const wrapper = mountWithProps()

      const variablesForms = wrapper.findAllComponents({ name: 'ServerVariablesForm' })
      await variablesForms[0]?.vm.$emit('update:variable', 'version', 'v3')
      await nextTick()
      await variablesForms[1]?.vm.$emit('update:variable', 'version', 'v4')
      await nextTick()

      expect(wrapper.emitted('server:update:variable')).toHaveLength(2)
      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([
        {
          serverUrl: baseServers[0]?.url,
          name: 'version',
          value: 'v3',
        },
      ])
      expect(wrapper.emitted('server:update:variable')?.[1]).toEqual([
        {
          serverUrl: baseServers[1]?.url,
          name: 'version',
          value: 'v4',
        },
      ])
    })
  })

  describe('edge cases', () => {
    it('handles empty servers array', () => {
      const wrapper = mountWithProps({ servers: [] })

      expect(wrapper.exists()).toBe(true)
      const serverCards = wrapper.findAll('.rounded-lg.border').filter((card) => {
        const hasForm = card.findComponent({ name: 'Form' }).exists()
        return hasForm
      })
      expect(serverCards.length).toBe(0)
    })

    it('handles single server', () => {
      const singleServer = [baseServers[0]]
      const wrapper = mountWithProps({ servers: singleServer })

      const forms = wrapper.findAllComponents({ name: 'Form' })
      expect(forms.length).toBe(1)
    })

    it('handles many servers', () => {
      const manyServers = [
        ...baseServers,
        { url: 'https://staging.api.example.com', description: 'Staging', variables: {} },
        { url: 'https://test.api.example.com', description: 'Test', variables: {} },
      ]
      const wrapper = mountWithProps({ servers: manyServers })

      const forms = wrapper.findAllComponents({ name: 'Form' })
      expect(forms.length).toBe(4)
    })

    it('handles server with empty description', () => {
      const serversWithEmptyDesc = [
        {
          url: 'https://api.example.com',
          description: '',
          variables: {},
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithEmptyDesc })

      expect(wrapper.text()).toContain('Server 1')
    })

    it('handles server without variables property', () => {
      const serversWithoutVariablesProp = [
        {
          url: 'https://api.example.com',
          description: 'Production API',
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithoutVariablesProp })

      const variablesForms = wrapper.findAllComponents({ name: 'ServerVariablesForm' })
      expect(variablesForms.length).toBe(0)
    })

    it('handles server with empty variables object', () => {
      const serversWithEmptyVariables = [
        {
          url: 'https://api.example.com',
          description: 'Production API',
          variables: {},
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithEmptyVariables })

      const variablesForms = wrapper.findAllComponents({ name: 'ServerVariablesForm' })
      expect(variablesForms[0]?.props('variables')).toEqual({})
    })

    it('handles markdown in server description', () => {
      const serversWithMarkdown = [
        {
          url: 'https://api.example.com',
          description: '**Production** API with `versioning`',
          variables: {},
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithMarkdown })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe('**Production** API with `versioning`')
    })

    it('handles long server URLs', () => {
      const serversWithLongUrl = [
        {
          url: 'https://very-long-subdomain.example.com/api/v1/production/endpoint',
          description: 'Long URL Server',
          variables: {},
        },
      ]
      const wrapper = mountWithProps({ servers: serversWithLongUrl })

      const form = wrapper.findComponent({ name: 'Form' })
      expect(form.props('data').url).toBe('https://very-long-subdomain.example.com/api/v1/production/endpoint')
    })
  })
})
