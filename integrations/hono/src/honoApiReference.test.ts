import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { apiReference } from './honoApiReference'

describe('apiReference', () => {
  it('should return HTML with default theme CSS when no theme is provided', async () => {
    const app = new Hono()
    const config = {
      cdn: 'https://cdn.example.com',
      spec: { content: { info: { title: 'Test API' } } },
    }
    app.get('/', apiReference(config))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.example.com')
    expect(text).toContain('Test API')
    expect(text).toContain('--scalar-color-1: #2a2f45;')
  })

  it('should not include default theme CSS when a theme is provided', async () => {
    const app = new Hono()
    app.get(
      '/',
      apiReference({
        spec: { content: { info: { title: 'Test API' } } },
        theme: 'kepler',
        cdn: 'https://cdn.example.com',
      }),
    )

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.example.com')
    expect(text).toContain('Test API')
    // Ensure default theme CSS is not included
    expect(text).not.toContain('--scalar-color-1')
  })

  it('should handle missing spec content gracefully', async () => {
    const app = new Hono()
    const options = {
      cdn: 'https://cdn.example.com',
    }
    app.get('/', apiReference(options))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.example.com')
    // Ensure no undefined content
    expect(text).not.toContain('undefined')
  })

  it('should use default CDN when no CDN is provided', async () => {
    const app = new Hono()
    const options = {
      spec: { content: { info: { title: 'Test API' } } },
    }
    app.get('/', apiReference(options))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
  })

  it("doesn't have the content twice", async () => {
    const app = new Hono()
    app.get('/', apiReference({ spec: { content: { info: { title: 'Test API' } } } }))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    const text = await response.text()

    // Check the title is present
    expect(text).toContain('Test API')

    // Check that the title is only present once
    const titleCount = (text.match(/Test API/g) || []).length
    expect(titleCount).toBe(1)
  })

  it('keeps the URL in the configuration', async () => {
    const app = new Hono()
    app.get(
      '/',
      apiReference({
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }),
    )

    const response = await app.request('/')
    const text = await response.text()

    // Check the URL is present
    expect(text).toContain('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json')
  })

  it('applies custom theme CSS when no theme is provided', async () => {
    const app = new Hono()
    app.get('/', apiReference({}))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('--scalar-color-1: #2a2f45;')
    expect(text).toContain('--scalar-color-accent: #0099ff')
  })

  it('does not include custom theme CSS when theme is provided', async () => {
    const app = new Hono()
    app.get('/', apiReference({ theme: 'none' }))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).not.toContain('--scalar-color-1: #2a2f45;')
  })

  it('includes _integration: "hono" in configuration', async () => {
    const app = new Hono()
    app.get('/', apiReference({}))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('_integration&quot;:&quot;hono&quot;')
  })

  it('handles content as function', async () => {
    const app = new Hono()
    const contentFn = () => ({ info: { title: 'Function API' } })
    app.get('/', apiReference({ spec: { content: contentFn } }))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('Function API')
  })

  it('removes spec.content when spec.url is provided', async () => {
    const app = new Hono()
    app.get(
      '/',
      apiReference({
        spec: {
          url: 'https://example.com/api.json',
          content: { info: { title: 'Test API' } },
        },
      }),
    )

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('https://example.com/api.json')
    expect(text).not.toContain('Test API')
  })

  it('sets correct content type and status', async () => {
    const app = new Hono()
    app.get('/', apiReference({}))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
  })
})
