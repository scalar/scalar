// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

import ResponseCookies from './ResponseCookies.vue'

type Cookie = { name: string; value: string }

/**
 * Helper to expand the ViewLayoutCollapse component by clicking the disclosure button
 */
const expandCookies = async (wrapper: ReturnType<typeof mount>) => {
  const button = wrapper.find('button')
  await button.trigger('click')
  await wrapper.vm.$nextTick()
}

describe('ResponseCookies', () => {
  describe('collapse functionality', () => {
    it('starts collapsed by default', () => {
      const cookies: Cookie[] = [{ name: 'session_id', value: 'abc123' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      // Content should not be visible when collapsed
      expect(wrapper.text()).not.toContain('abc123')
    })

    it('expands when disclosure button is clicked', async () => {
      const cookies: Cookie[] = [{ name: 'session_id', value: 'abc123' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      // Initially collapsed
      expect(wrapper.text()).not.toContain('abc123')

      // Click to expand
      await expandCookies(wrapper)

      // Now content should be visible
      expect(wrapper.text()).toContain('session_id')
      expect(wrapper.text()).toContain('abc123')
    })

    it('shows item count when collapsed', () => {
      const cookies: Cookie[] = [
        { name: 'cookie1', value: 'value1' },
        { name: 'cookie2', value: 'value2' },
        { name: 'cookie3', value: 'value3' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      // Should show count badge when collapsed
      expect(wrapper.text()).toContain('3')
    })
  })

  describe('rendering cookies', () => {
    it('renders a list of cookies correctly', async () => {
      const cookies: Cookie[] = [
        { name: 'session_id', value: 'abc123def456' },
        { name: 'user_token', value: 'token_xyz' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('session_id')
      expect(wrapper.text()).toContain('abc123def456')
      expect(wrapper.text()).toContain('user_token')
      expect(wrapper.text()).toContain('token_xyz')
    })

    it('renders single cookie', async () => {
      const cookies: Cookie[] = [{ name: 'auth', value: 'Bearer token123' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('auth')
      expect(wrapper.text()).toContain('Bearer token123')
    })

    it('renders multiple cookies with same name', async () => {
      const cookies: Cookie[] = [
        { name: 'tracking', value: 'id1' },
        { name: 'tracking', value: 'id2' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('id1')
      expect(wrapper.text()).toContain('id2')
    })

    it('renders cookies with special characters', async () => {
      const cookies: Cookie[] = [{ name: 'special-cookie_name', value: 'value with spaces & chars!' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('special-cookie_name')
      expect(wrapper.text()).toContain('value with spaces & chars!')
    })

    it('renders cookies with empty values', async () => {
      const cookies: Cookie[] = [{ name: 'empty-cookie', value: '' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('empty-cookie')
    })

    it('renders cookies with long values', async () => {
      const longValue = 'a'.repeat(500)
      const cookies: Cookie[] = [{ name: 'long-cookie', value: longValue }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('long-cookie')
      expect(wrapper.text()).toContain(longValue)
    })
  })

  describe('empty state', () => {
    it('shows empty state when no cookies provided', async () => {
      const wrapper = mount(ResponseCookies, {
        props: { cookies: [] },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('No cookies')
    })

    it('shows data table when cookies are present', async () => {
      const cookies: Cookie[] = [{ name: 'cookie', value: 'value' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      // Should not show empty state
      expect(wrapper.text()).not.toContain('No cookies')
    })
  })

  describe('title display', () => {
    it('displays title "Cookies"', () => {
      const cookies: Cookie[] = [{ name: 'cookie', value: 'value' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      // Title is always visible
      expect(wrapper.text()).toContain('Cookies')
    })
  })

  describe('common cookie types', () => {
    it('renders session cookies', async () => {
      const cookies: Cookie[] = [
        { name: 'PHPSESSID', value: 'abc123def456' },
        { name: 'JSESSIONID', value: 'xyz789' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('PHPSESSID')
      expect(wrapper.text()).toContain('JSESSIONID')
    })

    it('renders authentication cookies', async () => {
      const cookies: Cookie[] = [
        { name: 'access_token', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
        { name: 'refresh_token', value: 'refresh_xyz' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('access_token')
      expect(wrapper.text()).toContain('refresh_token')
    })

    it('renders tracking cookies', async () => {
      const cookies: Cookie[] = [
        { name: '_ga', value: 'GA1.2.123456789.1234567890' },
        { name: '_gid', value: 'GA1.2.987654321.0987654321' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('_ga')
      expect(wrapper.text()).toContain('_gid')
    })

    it('renders preference cookies', async () => {
      const cookies: Cookie[] = [
        { name: 'theme', value: 'dark' },
        { name: 'language', value: 'en-US' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('theme')
      expect(wrapper.text()).toContain('dark')
      expect(wrapper.text()).toContain('language')
      expect(wrapper.text()).toContain('en-US')
    })
  })

  describe('cookie values with special formats', () => {
    it('handles URL-encoded values', async () => {
      const cookies: Cookie[] = [{ name: 'redirect_url', value: 'https%3A%2F%2Fexample.com%2Fpath' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('https%3A%2F%2Fexample.com%2Fpath')
    })

    it('handles Base64 encoded values', async () => {
      const cookies: Cookie[] = [{ name: 'data', value: 'eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9')
    })

    it('handles JSON string values', async () => {
      const cookies: Cookie[] = [{ name: 'user_data', value: '{"id":123,"name":"John"}' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('{"id":123,"name":"John"}')
    })

    it('handles semicolon-separated attributes', async () => {
      const cookies: Cookie[] = [{ name: 'cookie', value: 'value; Path=/; HttpOnly; Secure' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('value; Path=/; HttpOnly; Secure')
    })
  })

  describe('edge cases', () => {
    it('handles cookies with colons in values', async () => {
      const cookies: Cookie[] = [{ name: 'time', value: '12:34:56' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('time')
      expect(wrapper.text()).toContain('12:34:56')
    })

    it('handles cookies with equals signs in values', async () => {
      const cookies: Cookie[] = [{ name: 'equation', value: 'x=y+z' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('equation')
      expect(wrapper.text()).toContain('x=y+z')
    })

    it('handles cookies with quotes in values', async () => {
      const cookies: Cookie[] = [{ name: 'quoted', value: 'He said "Hello"' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('quoted')
      expect(wrapper.text()).toContain('He said "Hello"')
    })

    it('handles cookies with commas in values', async () => {
      const cookies: Cookie[] = [{ name: 'list', value: 'item1,item2,item3' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('list')
      expect(wrapper.text()).toContain('item1,item2,item3')
    })

    it('handles cookies with very long names', async () => {
      const longName = 'very-long-cookie-name-that-goes-on-and-on-with-lots-of-text'
      const cookies: Cookie[] = [{ name: longName, value: 'value' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain(longName)
      expect(wrapper.text()).toContain('value')
    })

    it('handles cookies with unicode characters', async () => {
      const cookies: Cookie[] = [{ name: 'unicode', value: '你好世界 🌍' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('unicode')
      expect(wrapper.text()).toContain('你好世界 🌍')
    })
  })

  describe('real-world scenarios', () => {
    it('renders typical browser cookies', async () => {
      const cookies: Cookie[] = [
        { name: 'session_id', value: 'abc123def456ghi789' },
        { name: 'csrf_token', value: 'token_xyz_123' },
        { name: 'user_preferences', value: 'theme=dark&lang=en' },
        { name: '_ga', value: 'GA1.2.123456789.1234567890' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('session_id')
      expect(wrapper.text()).toContain('csrf_token')
      expect(wrapper.text()).toContain('user_preferences')
      expect(wrapper.text()).toContain('_ga')
    })

    it('renders JWT tokens in cookies', async () => {
      const cookies: Cookie[] = [
        {
          name: 'jwt',
          value:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
        },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('jwt')
      expect(wrapper.text()).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    })

    it('renders multiple authentication cookies', async () => {
      const cookies: Cookie[] = [
        { name: 'access_token', value: 'at_abc123' },
        { name: 'refresh_token', value: 'rt_xyz789' },
        { name: 'token_type', value: 'Bearer' },
        { name: 'expires_in', value: '3600' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('access_token')
      expect(wrapper.text()).toContain('refresh_token')
      expect(wrapper.text()).toContain('token_type')
      expect(wrapper.text()).toContain('expires_in')
    })

    it('renders large number of cookies', async () => {
      const cookies: Cookie[] = Array.from({ length: 20 }, (_, i) => ({
        name: `cookie_${i}`,
        value: `value_${i}`,
      }))

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      expect(wrapper.text()).toContain('cookie_0')
      expect(wrapper.text()).toContain('cookie_19')
    })
  })

  describe('component structure', () => {
    it('renders ViewLayoutCollapse component', () => {
      const cookies: Cookie[] = [{ name: 'test', value: 'value' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      const collapse = wrapper.findComponent(ViewLayoutCollapse)
      expect(collapse.exists()).toBe(true)
    })

    it('renders DataTable when cookies exist', async () => {
      const cookies: Cookie[] = [{ name: 'test', value: 'value' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      const dataTable = wrapper.findComponent(DataTable)
      expect(dataTable.exists()).toBe(true)
    })

    it('renders DataTableRow for each cookie', async () => {
      const cookies: Cookie[] = [
        { name: 'cookie1', value: 'value1' },
        { name: 'cookie2', value: 'value2' },
      ]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      const rows = wrapper.findAllComponents(DataTableRow)
      expect(rows.length).toBe(2)
    })

    it('renders DataTableText components for name and value', async () => {
      const cookies: Cookie[] = [{ name: 'test', value: 'value' }]

      const wrapper = mount(ResponseCookies, {
        props: { cookies },
      })

      await expandCookies(wrapper)

      const textComponents = wrapper.findAllComponents(DataTableText)
      expect(textComponents.length).toBeGreaterThanOrEqual(2)
    })
  })
})
