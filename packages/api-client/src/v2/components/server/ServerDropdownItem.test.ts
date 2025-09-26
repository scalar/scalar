import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ServerDropdownItem from './ServerDropdownItem.vue'

describe('ServerDropdownItem', () => {
  const defaultServerOption = {
    id: 'server-1',
    label: 'https://api.example.com',
  }

  const defaultServer = {
    url: 'https://api.example.com',
    description: 'Production API server',
    variables: {
      version: {
        default: 'v1',
        enum: ['v1', 'v2'],
        description: 'API version',
      },
      environment: {
        default: 'prod',
        description: 'Environment',
      },
    },
  }

  it('renders the server option label correctly', () => {
    const wrapper = mount(ServerDropdownItem, {
      props: {
        server: defaultServer,
        serverOption: defaultServerOption,
      },
    })

    expect(wrapper.text()).toContain('https://api.example.com')
  })

  it('renders checkbox component when server matches serverOption id', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    // Check that ScalarListboxCheckbox is rendered with selected prop
    const checkbox = wrapper.findComponent({ name: 'ScalarListboxCheckbox' })
    expect(checkbox.exists()).toBe(true)
    expect(checkbox.props('selected')).toBe(true)
  })

  it('renders checkbox component when server does not match serverOption id', () => {
    const server = { ...defaultServer, url: 'different-server' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    // Check that ScalarListboxCheckbox is rendered with selected prop false
    const checkbox = wrapper.findComponent({ name: 'ScalarListboxCheckbox' })
    expect(checkbox.exists()).toBe(true)
    expect(checkbox.props('selected')).toBe(false)
  })

  it('applies selected styling when server is selected', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('text-c-1')
    expect(button.classes()).toContain('bg-b-2')
  })

  it('applies hover styling when server is not selected', () => {
    const server = { ...defaultServer, url: 'different-server' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('hover:bg-b-2')
    expect(button.classes()).not.toContain('text-c-1')
    expect(button.classes()).not.toContain('bg-b-2')
  })

  it('emits update:selectedServer when button is clicked', async () => {
    const wrapper = mount(ServerDropdownItem, {
      props: {
        server: defaultServer,
        serverOption: defaultServerOption,
      },
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.emitted('update:selectedServer')).toBeTruthy()
    expect(wrapper.emitted('update:selectedServer')?.[0]).toEqual([{ id: 'server-1' }])
  })

  it('shows variables form when server is selected and has variables', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(true)
  })

  it('does not show variables form when server is not selected', () => {
    const server = { ...defaultServer, url: 'different-server' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(false)
  })

  it('does not show variables form when server has no variables', () => {
    const server = { ...defaultServer, url: 'server-1', variables: {} }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(false)
  })

  it('shows description when server is selected and has description', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
    expect(markdown.exists()).toBe(true)
    expect(markdown.props('value')).toBe('Production API server')
  })

  it('does not show description when server has no description', () => {
    const server = { ...defaultServer, url: 'server-1', description: undefined }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
    expect(markdown.exists()).toBe(false)
  })

  it('emits update:variable when ServerVariablesForm emits update:variable', async () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    await variablesForm.vm.$emit('update:variable', 'testKey', 'testValue')

    expect(wrapper.emitted('update:variable')).toBeTruthy()
    expect(wrapper.emitted('update:variable')?.[0]).toEqual(['testKey', 'testValue'])
  })

  it('sets correct aria attributes when expanded', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-controls')).toBeDefined()
  })

  it('sets correct aria attributes when not expanded', () => {
    const server = { ...defaultServer, url: 'different-server' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBeUndefined()
  })

  it('handles undefined server gracefully', () => {
    const wrapper = mount(ServerDropdownItem, {
      props: {
        server: undefined,
        serverOption: defaultServerOption,
      },
    })

    expect(wrapper.text()).toContain('https://api.example.com')
    const checkbox = wrapper.findComponent({ name: 'ScalarListboxCheckbox' })
    expect(checkbox.props('selected')).toBe(false)
    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(false)
  })

  it('handles server with undefined variables gracefully', () => {
    const server = { url: 'server-1', variables: undefined }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    // Should be selected but not expanded since no variables
    const checkbox = wrapper.findComponent({ name: 'ScalarListboxCheckbox' })
    expect(checkbox.props('selected')).toBe(true)
    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(false)
  })

  it('handles empty server variables object', () => {
    const server = { ...defaultServer, url: 'server-1', variables: {} }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    // Should be selected but not expanded since no variables
    const checkbox = wrapper.findComponent({ name: 'ScalarListboxCheckbox' })
    expect(checkbox.props('selected')).toBe(true)
    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(false)
  })

  it('renders variables form container when expanded', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(true)
  })

  it('passes variables to ServerVariablesForm correctly', () => {
    const server = { ...defaultServer, url: 'server-1' }

    const wrapper = mount(ServerDropdownItem, {
      props: {
        server,
        serverOption: defaultServerOption,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.props('variables')).toEqual(server.variables)
  })
})
