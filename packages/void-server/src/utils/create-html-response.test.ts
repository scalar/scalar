import { createMockContext } from '@test/utils/create-mock-context'
import { describe, expect, it } from 'vitest'

import { createHtmlResponse } from '@/utils/create-html-response'

describe('create-html-response', () => {
  it('sets Content-Type header to text/html', () => {
    const mockContext = createMockContext()

    createHtmlResponse(mockContext as any, { foo: 'bar' })

    expect(mockContext.header).toHaveBeenCalledWith('Content-Type', 'text/html')
  })

  it('generates HTML with simple key-value pairs', () => {
    const mockContext = createMockContext()

    createHtmlResponse(mockContext as any, { name: 'John', age: 30 })

    const html = mockContext._getHtmlContent()

    expect(html).toContain('<strong>name:</strong> John')
    expect(html).toContain('<strong>age:</strong> 30')
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>Void</title>')
  })

  it('generates nested HTML structure for nested objects', () => {
    const mockContext = createMockContext()

    createHtmlResponse(mockContext as any, {
      user: {
        name: 'Jane',
        address: {
          city: 'Berlin',
        },
      },
    })

    const html = mockContext._getHtmlContent()

    expect(html).toContain('<strong>user:</strong>')
    expect(html).toContain('<strong>name:</strong> Jane')
    expect(html).toContain('<strong>address:</strong>')
    expect(html).toContain('<strong>city:</strong> Berlin')
    expect(html).toContain('<ul>')
  })

  it('escapes HTML in keys and values to prevent XSS attacks', () => {
    const mockContext = createMockContext()

    createHtmlResponse(mockContext as any, {
      '<script>alert("xss")</script>': 'value',
      name: '<img src=x onerror=alert("xss")>',
      nested: {
        dangerous: '"><script>evil()</script>',
      },
    })

    const html = mockContext._getHtmlContent()

    // Script and img tags should be escaped, not rendered as executable HTML
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('</script>')
    expect(html).not.toContain('<img')

    // The escaped versions should be present
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img')
    expect(html).toContain('&lt;/script&gt;')
  })
})
