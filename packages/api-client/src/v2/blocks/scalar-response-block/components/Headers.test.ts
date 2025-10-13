// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Headers from './Headers.vue'

type Header = { name: string; value: string }

/**
 * Helper to expand the ViewLayoutCollapse component by clicking the disclosure button
 */
const expandHeaders = async (wrapper: ReturnType<typeof mount>) => {
  const button = wrapper.find('button')
  await button.trigger('click')
  await wrapper.vm.$nextTick()
}

describe('Headers', () => {
  describe('collapse functionality', () => {
    it('starts collapsed by default', () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      // Content should not be visible when collapsed
      expect(wrapper.text()).not.toContain('application/json')
    })

    it('expands when disclosure button is clicked', async () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      // Initially collapsed
      expect(wrapper.text()).not.toContain('application/json')

      // Click to expand
      await expandHeaders(wrapper)

      // Now content should be visible
      expect(wrapper.text()).toContain('Content-Type')
      expect(wrapper.text()).toContain('application/json')
    })

    it('shows item count when collapsed', () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Cache-Control', value: 'no-cache' },
        { name: 'Authorization', value: 'Bearer token' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      // Should show count badge when collapsed
      expect(wrapper.text()).toContain('3')
    })
  })

  describe('rendering headers', () => {
    it('renders a list of headers correctly', async () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Cache-Control', value: 'no-cache' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
        slots: {
          title: 'Response Headers',
        },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Content-Type')
      expect(wrapper.text()).toContain('application/json')
      expect(wrapper.text()).toContain('Cache-Control')
      expect(wrapper.text()).toContain('no-cache')
    })

    it('renders single header', async () => {
      const headers: Header[] = [{ name: 'Authorization', value: 'Bearer token123' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Authorization')
      expect(wrapper.text()).toContain('Bearer token123')
    })

    it('renders multiple headers with same name', async () => {
      const headers: Header[] = [
        { name: 'Set-Cookie', value: 'sessionId=abc123' },
        { name: 'Set-Cookie', value: 'userId=xyz789' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('sessionId=abc123')
      expect(wrapper.text()).toContain('userId=xyz789')
    })

    it('renders headers with special characters', async () => {
      const headers: Header[] = [{ name: 'X-Custom-Header', value: 'value with spaces & special chars!' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('X-Custom-Header')
      expect(wrapper.text()).toContain('value with spaces & special chars!')
    })

    it('renders headers with empty values', async () => {
      const headers: Header[] = [{ name: 'X-Empty', value: '' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('X-Empty')
    })

    it('renders headers with long values', async () => {
      const longValue = 'a'.repeat(500)
      const headers: Header[] = [{ name: 'X-Long-Value', value: longValue }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('X-Long-Value')
      expect(wrapper.text()).toContain(longValue)
    })
  })

  describe('known headers with links', () => {
    it('renders HelpfulLink for well-known headers', async () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      // Content-Type is a known header, should have a link
      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('Content-Type')
    })

    it('renders plain text for unknown headers', async () => {
      const headers: Header[] = [{ name: 'X-Custom-Unknown-Header', value: 'custom value' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      // Unknown header should not have a link
      const links = wrapper.findAll('a')
      expect(links.length).toBe(0)
      expect(wrapper.text()).toContain('X-Custom-Unknown-Header')
    })

    it('handles mixed known and unknown headers', async () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Custom', value: 'custom' },
        { name: 'Cache-Control', value: 'no-cache' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      // Should have links for known headers
      const links = wrapper.findAll('a')
      expect(links.length).toBeGreaterThan(0)

      // Should contain all headers
      expect(wrapper.text()).toContain('Content-Type')
      expect(wrapper.text()).toContain('X-Custom')
      expect(wrapper.text()).toContain('Cache-Control')
    })
  })

  describe('case-insensitive header lookup', () => {
    it('finds header info regardless of case', async () => {
      const headers: Header[] = [
        { name: 'content-type', value: 'application/json' },
        { name: 'CACHE-CONTROL', value: 'no-cache' },
        { name: 'Content-Length', value: '1024' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      // All of these are known headers, should have links
      const links = wrapper.findAll('a')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('empty state', () => {
    it('shows empty state when no headers provided', async () => {
      const wrapper = mount(Headers, {
        props: { headers: [] },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('No Headers')
    })

    it('shows data table when headers are present', async () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      // Should not show empty state
      expect(wrapper.text()).not.toContain('No Headers')
    })
  })

  describe('slot usage', () => {
    it('renders title slot content', () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
        slots: {
          title: 'Custom Title',
        },
      })

      // Title is always visible, no need to expand
      expect(wrapper.text()).toContain('Custom Title')
    })

    it('renders HTML in title slot', () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
        slots: {
          title: '<span class="custom">Response Headers</span>',
        },
      })

      // Title is always visible, no need to expand
      expect(wrapper.text()).toContain('Response Headers')
      const customSpan = wrapper.find('.custom')
      expect(customSpan.exists()).toBe(true)
    })

    it('works without title slot', () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      // Should render without errors
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('includes screen reader only header labels', async () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'application/json' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      // Should have sr-only class for accessibility
      const srOnly = wrapper.findAll('.sr-only')
      // Find the one with header labels (not the collapsed state one)
      const headerLabelsElement = srOnly.find((el) => el.text().includes('Header Key'))
      expect(headerLabelsElement).toBeDefined()
      expect(headerLabelsElement?.text()).toContain('Header Key')
      expect(headerLabelsElement?.text()).toContain('Header Value')
    })
  })

  describe('common HTTP headers', () => {
    it('renders standard request headers', async () => {
      const headers: Header[] = [
        { name: 'Accept', value: 'application/json' },
        { name: 'Accept-Encoding', value: 'gzip, deflate, br' },
        { name: 'Accept-Language', value: 'en-US,en;q=0.9' },
        { name: 'Authorization', value: 'Bearer token' },
        { name: 'User-Agent', value: 'Mozilla/5.0' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Accept')
      expect(wrapper.text()).toContain('Accept-Encoding')
      expect(wrapper.text()).toContain('Accept-Language')
      expect(wrapper.text()).toContain('Authorization')
      expect(wrapper.text()).toContain('User-Agent')
    })

    it('renders standard response headers', async () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Content-Length', value: '1024' },
        { name: 'Cache-Control', value: 'no-cache' },
        { name: 'ETag', value: '"abc123"' },
        { name: 'Last-Modified', value: 'Wed, 21 Oct 2015 07:28:00 GMT' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Content-Type')
      expect(wrapper.text()).toContain('Content-Length')
      expect(wrapper.text()).toContain('Cache-Control')
      expect(wrapper.text()).toContain('ETag')
      expect(wrapper.text()).toContain('Last-Modified')
    })

    it('renders CORS headers', async () => {
      const headers: Header[] = [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Access-Control-Allow-Origin')
      expect(wrapper.text()).toContain('Access-Control-Allow-Methods')
      expect(wrapper.text()).toContain('Access-Control-Allow-Headers')
    })

    it('renders security headers', async () => {
      const headers: Header[] = [
        { name: 'Strict-Transport-Security', value: 'max-age=31536000' },
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'X-XSS-Protection', value: '1; mode=block' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Strict-Transport-Security')
      expect(wrapper.text()).toContain('X-Content-Type-Options')
      expect(wrapper.text()).toContain('X-Frame-Options')
      expect(wrapper.text()).toContain('X-XSS-Protection')
    })
  })

  describe('edge cases', () => {
    it('handles headers with colons in values', async () => {
      const headers: Header[] = [{ name: 'Link', value: '<https://example.com>; rel="canonical"' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Link')
      expect(wrapper.text()).toContain('<https://example.com>; rel="canonical"')
    })

    it('handles headers with quotes in values', async () => {
      const headers: Header[] = [{ name: 'ETag', value: '"abc123-def456"' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('ETag')
      expect(wrapper.text()).toContain('"abc123-def456"')
    })

    it('handles headers with commas in values', async () => {
      const headers: Header[] = [{ name: 'Accept', value: 'text/html, application/json, */*' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Accept')
      expect(wrapper.text()).toContain('text/html, application/json, */*')
    })

    it('handles headers with semicolons in values', async () => {
      const headers: Header[] = [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Content-Type')
      expect(wrapper.text()).toContain('text/html; charset=utf-8')
    })

    it('handles headers with newlines in values', async () => {
      const headers: Header[] = [{ name: 'X-Custom', value: 'line1\nline2' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('X-Custom')
      expect(wrapper.text()).toContain('line1')
      expect(wrapper.text()).toContain('line2')
    })

    it('handles headers with very long names', async () => {
      const longName = 'X-Very-Long-Custom-Header-Name-That-Is-Unusually-Extended'
      const headers: Header[] = [{ name: longName, value: 'value' }]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain(longName)
      expect(wrapper.text()).toContain('value')
    })
  })

  describe('real-world scenarios', () => {
    it('renders typical API response headers', async () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/json; charset=utf-8' },
        { name: 'Content-Length', value: '1234' },
        { name: 'Date', value: 'Thu, 02 Oct 2025 12:00:00 GMT' },
        { name: 'Server', value: 'nginx/1.21.0' },
        { name: 'X-Request-Id', value: 'abc-123-def-456' },
        { name: 'X-RateLimit-Limit', value: '100' },
        { name: 'X-RateLimit-Remaining', value: '99' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
        slots: {
          title: 'Response Headers',
        },
      })

      // Title is always visible
      expect(wrapper.text()).toContain('Response Headers')

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('application/json')
      expect(wrapper.text()).toContain('nginx')
      expect(wrapper.text()).toContain('X-Request-Id')
    })

    it('renders GraphQL response headers', async () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/graphql+json' },
        { name: 'X-GraphQL-Operation-Name', value: 'getUser' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('application/graphql+json')
      expect(wrapper.text()).toContain('X-GraphQL-Operation-Name')
    })

    it('renders file download response headers', async () => {
      const headers: Header[] = [
        { name: 'Content-Type', value: 'application/octet-stream' },
        { name: 'Content-Disposition', value: 'attachment; filename="file.pdf"' },
        { name: 'Content-Length', value: '524288' },
      ]

      const wrapper = mount(Headers, {
        props: { headers },
      })

      await expandHeaders(wrapper)

      expect(wrapper.text()).toContain('Content-Disposition')
      expect(wrapper.text()).toContain('attachment; filename="file.pdf"')
    })
  })
})
