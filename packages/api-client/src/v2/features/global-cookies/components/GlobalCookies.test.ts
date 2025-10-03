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
  it('renders the header correctly', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    expect(wrapper.text()).toContain('Global cookies')
    expect(wrapper.text()).toContain('Manage your global cookies here.')
  })

  it('renders the CookiesTable component', () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    expect(cookiesTable.exists()).toBe(true)
  })

  it('emits addCookie when CookiesTable emits addRow', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    const payload = { name: 'new_cookie', value: 'test', domain: '.test.com' }

    await cookiesTable.vm.$emit('addRow', payload)

    expect(wrapper.emitted('addCookie')).toBeTruthy()
    expect(wrapper.emitted('addCookie')?.[0]).toEqual([payload])
  })

  it('emits updateCookie when CookiesTable emits updateRow', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    const index = 0
    const payload = { name: 'updated_name' }

    await cookiesTable.vm.$emit('updateRow', index, payload)

    expect(wrapper.emitted('updateCookie')).toBeTruthy()
    expect(wrapper.emitted('updateCookie')?.[0]).toEqual([index, payload])
  })

  it('emits deleteCookie when CookiesTable emits deleteRow', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
    const index = 1

    await cookiesTable.vm.$emit('deleteRow', index)

    expect(wrapper.emitted('deleteCookie')).toBeTruthy()
    expect(wrapper.emitted('deleteCookie')?.[0]).toEqual([index])
  })

  it('handles multiple event emissions correctly', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
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

    expect(wrapper.emitted('addCookie')).toBeTruthy()
    expect(wrapper.emitted('updateCookie')).toBeTruthy()
    expect(wrapper.emitted('deleteCookie')).toBeTruthy()
  })

  it('preserves partial cookie payloads in addCookie event', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: [],
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })

    /** Test with only name field */
    await cookiesTable.vm.$emit('addRow', { name: 'test' })
    expect(wrapper.emitted('addCookie')?.[0]).toEqual([{ name: 'test' }])

    /** Test with only isDisabled field */
    await cookiesTable.vm.$emit('addRow', { isDisabled: false })
    expect(wrapper.emitted('addCookie')?.[1]).toEqual([{ isDisabled: false }])
  })

  it('preserves partial cookie payloads in updateCookie event', async () => {
    const wrapper = mount(GlobalCookies, {
      props: {
        cookies: mockCookies,
        environment: mockEnvironment,
        envVariables: [],
      },
    })

    const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })

    /** Test updating only the name */
    await cookiesTable.vm.$emit('updateRow', 0, { name: 'new_name' })
    expect(wrapper.emitted('updateCookie')?.[0]).toEqual([0, { name: 'new_name' }])

    /** Test updating only the isDisabled flag */
    await cookiesTable.vm.$emit('updateRow', 1, { isDisabled: true })
    expect(wrapper.emitted('updateCookie')?.[1]).toEqual([1, { isDisabled: true }])
  })
})
