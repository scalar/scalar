import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Scalar } from './scalar'

type Bindings = {
  SOME_VAR: string
  ENVIRONMENT: string
}

describe('Scalar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

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
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
      }),
    )

    const response = await app.request('/')
    const text = await response.text()

    // Check the URL is present
    expect(text).toContain('https://registry.scalar.com/@scalar/apis/galaxy?format=json')
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
    vi.useFakeTimers()

    const app = new Hono<{ Bindings: Bindings }>()
    // mock env
    app.use('*', (c, next) => {
      c.env = { SOME_VAR: 'SOME_VAR', ENVIRONMENT: 'development' }
      return next()
    })

    const config = { content: { info: { title: 'Test API' } } }

    app.get(
      '/',
      Scalar<{ Bindings: Bindings }>(async (c) => {
        expect(c.env.SOME_VAR).toBe('SOME_VAR')
        expect(c.env.ENVIRONMENT).toBe('development')

        const theme = await new Promise<'deepSpace'>((resolve) => {
          setTimeout(
            () => resolve('deepSpace'),
            // advance time by the same amount below
            100,
          )
        })
        return { ...config, theme }
      }),
    )

    const req = app.request('/')
    // Same time of handler Promise above
    vi.advanceTimersByTime(100)
    const response = await req

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<title>Scalar API Reference</title>')
    expect(text).toContain('Test API')
    expect(text).toContain('deepSpace')
  })

  describe('serve', () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Serve API', version: '1.0.0' },
      paths: {},
    }

    it('serves the OpenAPI document as JSON at the mount point', async () => {
      const app = new Hono()
      app.route('/scalar', Scalar.serve({ document }))

      const response = await app.request('/scalar/openapi.json')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(await response.json()).toEqual(document)
    })

    it('renders the reference at the mount point, pointing at the served document', async () => {
      const app = new Hono()
      app.route('/scalar', Scalar.serve({ document }))

      const response = await app.request('/scalar')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/html')

      const text = await response.text()
      expect(text).toContain('<title>Scalar API Reference</title>')
      // The reference points at the document we serve alongside it
      expect(text).toContain('/scalar/openapi.json')
      // The document is referenced by URL, not inlined
      expect(text).not.toContain('Serve API')
    })

    it('serves the document at a custom documentPath', async () => {
      const app = new Hono()
      app.route('/scalar', Scalar.serve({ document, documentPath: '/spec.json' }))

      const json = await app.request('/scalar/spec.json')
      expect(json.status).toBe(200)
      expect(await json.json()).toEqual(document)

      const html = await (await app.request('/scalar')).text()
      expect(html).toContain('/scalar/spec.json')
    })

    it('resolves the document from a function with access to the context', async () => {
      const app = new Hono()
      app.route(
        '/scalar',
        Scalar.serve({
          document: (c) => ({ ...document, info: { ...document.info, title: c.req.path } }),
        }),
      )

      const response = await app.request('/scalar/openapi.json')
      expect(await response.json()).toMatchObject({ info: { title: '/scalar/openapi.json' } })
    })

    it('passes through reference options like pageTitle and theme', async () => {
      const app = new Hono()
      app.route('/scalar', Scalar.serve({ document, pageTitle: 'Serve Title', theme: 'kepler' }))

      const text = await (await app.request('/scalar')).text()
      expect(text).toContain('<title>Serve Title</title>')
      // A theme was provided, so the custom Hono theme CSS is not injected
      expect(text).not.toContain('--scalar-color-1: rgba(255, 255, 245, .86);')
    })

    it('includes the hono integration marker and the custom theme by default', async () => {
      const app = new Hono()
      app.route('/scalar', Scalar.serve({ document }))

      const text = await (await app.request('/scalar')).text()
      expect(text).toContain('_integration": "hono"')
      expect(text).toContain('--scalar-color-1: rgba(255, 255, 245, .86);')
    })

    it('works when mounted at the root', async () => {
      const app = new Hono()
      app.route('/', Scalar.serve({ document }))

      const html = await (await app.request('/')).text()
      expect(html).toContain('/openapi.json')

      const json = await app.request('/openapi.json')
      expect(await json.json()).toEqual(document)
    })
  })
})
