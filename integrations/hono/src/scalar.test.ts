import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { Scalar, apiReference } from './scalar'

type Bindings = {
  SOME_VAR: string
  ENVIRONMENT: string
}

describe('apiReference', () => {
  it('returns HTML with default theme CSS when theme is not provided', async () => {
    const app = new Hono()
    const config = {
      cdn: 'https://cdn.example.com',
      content: { info: { title: 'Test API' } },
    }

    app.get('/', Scalar(config))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.example.com')
    expect(text).toContain('Test API')
    expect(text).toContain('--scalar-color-1: rgba(255, 255, 245, .86);')
  })

  it('excludes default theme CSS when theme is provided', async () => {
    const app = new Hono()
    app.get(
      '/',
      Scalar({
        content: { info: { title: 'Test API' } },
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

  it('handles missing spec content gracefully', async () => {
    const app = new Hono()
    const options = {
      cdn: 'https://cdn.example.com',
    }
    app.get('/', Scalar(options))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.example.com')
    // Ensure no undefined content
    expect(text).not.toContain('undefined')
  })

  it('uses default CDN when CDN is not provided', async () => {
    const app = new Hono()
    const options = {
      content: { info: { title: 'Test API' } },
    }
    app.get('/', Scalar(options))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
  })

  it('includes content only once', async () => {
    const app = new Hono()
    app.get('/', Scalar({ content: { info: { title: 'Test API' } } }))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    const text = await response.text()

    // Check the title is present
    expect(text).toContain('Test API')

    // Check that the title is only present once
    const titleCount = (text.match(/Test API/g) || []).length
    expect(titleCount).toBe(1)
  })

  it('preserves URL in configuration', async () => {
    const app = new Hono()
    app.get(
      '/',
      Scalar({
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      }),
    )

    const response = await app.request('/')
    const text = await response.text()

    // Check the URL is present
    expect(text).toContain('https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json')
  })

  it('applies custom theme CSS without theme specified', async () => {
    const app = new Hono()
    app.get('/', Scalar({}))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('--scalar-color-1: rgba(255, 255, 245, .86);')
    expect(text).toContain('--scalar-color-accent: #e36002')
  })

  it('excludes custom theme CSS when theme is specified', async () => {
    const app = new Hono()
    app.get('/', Scalar({ theme: 'none' }))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).not.toContain('--scalar-color-1: rgba(255, 255, 245, .86);')
  })

  it('includes hono integration in configuration', async () => {
    const app = new Hono()
    app.get('/', Scalar({}))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('_integration": "hono"')
  })

  it('handles content as function', async () => {
    const app = new Hono()
    const contentFn = () => ({ info: { title: 'Function API' } })
    app.get('/', Scalar({ content: contentFn }))

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('Function API')
  })

  it('removes content when URL is provided', async () => {
    const app = new Hono()
    app.get(
      '/',
      Scalar({
        url: 'https://example.com/api.json',
        content: { info: { title: 'Test API' } },
      }),
    )

    const response = await app.request('/')
    const text = await response.text()
    expect(text).toContain('https://example.com/api.json')
    expect(text).not.toContain('Test API')
  })

  it('sets HTML content type and 200 status', async () => {
    const app = new Hono()
    app.get('/', Scalar({}))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('works with the deprecated export', async () => {
    const app = new Hono()
    const config = {
      cdn: 'https://cdn.example.com',
      content: { info: { title: 'Test API' } },
    }

    app.get('/', apiReference(config))

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('https://cdn.example.com')
    expect(text).toContain('Test API')
    expect(text).toContain('--scalar-color-1: rgba(255, 255, 245, .86);')
  })

  it('works with config resolver', async () => {
    const app = new Hono<{ Bindings: Bindings }>()
    // mock env
    app.use('*', (c, next) => {
      c.env = { SOME_VAR: 'SOME_VAR', ENVIRONMENT: 'development' }
      return next()
    })

    const config = { content: { info: { title: 'Test API' } } }

    app.get(
      '/',
      Scalar<{ Bindings: Bindings }>((c) => {
        expect(c.env.SOME_VAR).toBe('SOME_VAR')
        expect(c.env.ENVIRONMENT).toBe('development')
        return {
          ...config,
          proxyUrl: c.env.ENVIRONMENT === 'development' ? 'https://proxy.scalar.com' : undefined,
        }
      }),
    )

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('Test API')
    expect(text).toContain('https://proxy.scalar.com')
  })

  it('works with config resolver (async)', async () => {
    const app = new Hono<{ Bindings: Bindings }>()
    // mock env
    app.use('*', (c, next) => {
      c.env = { SOME_VAR: 'SOME_VAR', ENVIRONMENT: 'development' }
      return next()
    })

    const config = { content: { info: { title: 'Test API' } } }

    const getTheme = async (): Promise<'deepSpace' | 'laserwave'> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('deepSpace')
        }, 100)
      })
    }

    app.get(
      '/',
      Scalar<{ Bindings: Bindings }>(async (c) => {
        expect(c.env.SOME_VAR).toBe('SOME_VAR')
        expect(c.env.ENVIRONMENT).toBe('development')

        const theme = await getTheme()
        return { ...config, theme }
      }),
    )

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('Test API')
    expect(text).toContain('deepSpace')
  })
})
