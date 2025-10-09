// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import GlobalCookies from './GlobalCookies.vue'

const mockEnvironment = {
  uid: '' as any,
  name: '',
  value: '',
  color: '',
}

const mockCookies = [
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
]

describe('GlobalCookies', () => {
  it('renders the header with "Global cookies" when documentName is null', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Global cookies')
    expect(wrapper.text()).toContain('Manage your global cookies here.')
  })

  it('renders the header with document name when documentName is provided', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: 'My API',
        documents: ['My API', 'Other API'],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('My API cookies')
    expect(wrapper.text()).toContain('Manage your global cookies here.')
  })

  it('renders the CookiesTable component', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    expect(cookiesTable.exists()).toBe(true)
  })

  it('renders the CookiesSidebar component', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'CookiesSidebar' })
    expect(sidebar.exists()).toBe(true)
  })

  it('emits cookie:add when CookiesTable emits addRow', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    const payload = { name: 'new_cookie', value: 'test', domain: '.test.com' }

    await cookiesTable.vm.$emit('addRow', payload)

    expect(wrapper.emitted('cookie:add')).toBeTruthy()
    expect(wrapper.emitted('cookie:add')?.[0]).toEqual([payload])
  })

  it('emits cookie:update when CookiesTable emits updateRow', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    const index = 0
    const payload = { name: 'updated_name' }

    await cookiesTable.vm.$emit('updateRow', index, payload)

    expect(wrapper.emitted('cookie:update')).toBeTruthy()
    expect(wrapper.emitted('cookie:update')?.[0]).toEqual([index, payload])
  })

  it('emits cookie:delete when CookiesTable emits deleteRow', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    const index = 1

    await cookiesTable.vm.$emit('deleteRow', index)

    expect(wrapper.emitted('cookie:delete')).toBeTruthy()
    expect(wrapper.emitted('cookie:delete')?.[0]).toEqual([index])
  })

  it('emits navigation:update:selection when CookiesSidebar emits update:selection', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: ['API 1', 'API 2'],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'CookiesSidebar' })
    await sidebar.vm.$emit('update:selection', 'API 1')

    expect(wrapper.emitted('navigation:update:selection')).toBeTruthy()
    expect(wrapper.emitted('navigation:update:selection')?.[0]).toEqual(['API 1'])
  })

  it('emits navigation:update:sidebarWidth when CookiesSidebar emits update:width', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'CookiesSidebar' })
    await sidebar.vm.$emit('update:width', 300)

    expect(wrapper.emitted('navigation:update:sidebarWidth')).toBeTruthy()
    expect(wrapper.emitted('navigation:update:sidebarWidth')?.[0]).toEqual([300])
  })

  it('handles multiple event emissions correctly', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })

    /** Emit add event */
    await cookiesTable.vm.$emit('addRow', { name: 'cookie1' })

    /** Emit update event */
    await cookiesTable.vm.$emit('updateRow', 0, { value: 'newvalue' })

    /** Emit delete event */
    await cookiesTable.vm.$emit('deleteRow', 1)

    expect(wrapper.emitted('cookie:add')).toBeTruthy()
    expect(wrapper.emitted('cookie:update')).toBeTruthy()
    expect(wrapper.emitted('cookie:delete')).toBeTruthy()
  })

  it('preserves partial cookie payloads in cookie:add event', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })

    /** Test with only name field */
    await cookiesTable.vm.$emit('addRow', { name: 'test' })
    expect(wrapper.emitted('cookie:add')?.[0]).toEqual([{ name: 'test' }])

    /** Test with only isDisabled field */
    await cookiesTable.vm.$emit('addRow', { isDisabled: false })
    expect(wrapper.emitted('cookie:add')?.[1]).toEqual([{ isDisabled: false }])
  })

  it('preserves partial cookie payloads in cookie:update event', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })

    /** Test updating only the name */
    await cookiesTable.vm.$emit('updateRow', 0, { name: 'new_name' })
    expect(wrapper.emitted('cookie:update')?.[0]).toEqual([0, { name: 'new_name' }])

    /** Test updating only the isDisabled flag */
    await cookiesTable.vm.$emit('updateRow', 1, { isDisabled: true })
    expect(wrapper.emitted('cookie:update')?.[1]).toEqual([1, { isDisabled: true }])
  })

  it('passes sidebarWidth prop to CookiesSidebar', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: null,
        documents: [],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
        sidebarWidth: 250,
      },
    })

    const sidebar = wrapper.findComponent({ name: 'CookiesSidebar' })
    expect(sidebar.props('width')).toBe(250)
  })

  it('passes documentName and documents props to CookiesSidebar', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        documentName: 'My API',
        documents: ['My API', 'Other API'],
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'CookiesSidebar' })
    expect(sidebar.props('documentName')).toBe('My API')
    expect(sidebar.props('documents')).toEqual(['My API', 'Other API'])
  })
})
