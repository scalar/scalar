import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiReference } from '../src'
import { createTestApp } from './app.factory'

describe('apiReference middleware (express)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createTestApp()
  })

  afterEach(() => app.close())

  it('should return HTML with default theme CSS when no theme is provided', async () => {
    app.use(
      '/reference',
      apiReference({
        content: { info: { title: 'Test API' } },
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.status).toBe(200)
    expect(res.type).toBe('text/html')
    expect(res.text).toContain('<title>Scalar API Reference</title>')
    expect(res.text).toContain('Test API')
    expect(res.text).toContain('--scalar-color-1: #1b1b1b;')
  })

  it('should not include default theme CSS when a theme is provided', async () => {
    app.use(
      '/reference',
      apiReference({
        content: { info: { title: 'Test API' } },
        theme: 'kepler',
        cdn: 'https://cdn.example.com',
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.status).toBe(200)
    expect(res.type).toBe('text/html')
    expect(res.text).toContain('<title>Scalar API Reference</title>')
    expect(res.text).toContain('https://cdn.example.com')
    expect(res.text).toContain('Test API')
    expect(res.text).not.toContain('--scalar-color-1: #1b1b1b;')
  })

  it('should handle missing spec content gracefully', async () => {
    app.use(
      '/reference',
      apiReference({
        cdn: 'https://cdn.example.com',
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.status).toBe(200)
    expect(res.type).toBe('text/html')
    expect(res.text).toContain('<title>Scalar API Reference</title>')
    expect(res.text).toContain('https://cdn.example.com')
    expect(res.text).not.toContain('undefined')
  })

  it('should use default CDN when no CDN is provided', async () => {
    app.use(
      '/reference',
      apiReference({
        content: { info: { title: 'Test API' } },
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.status).toBe(200)
    expect(res.type).toBe('text/html')
    expect(res.text).toContain('<title>Scalar API Reference</title>')
    expect(res.text).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
  })

  it('keeps the URL in the configuration', async () => {
    app.use(
      '/reference',
      apiReference({
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.text).toContain('https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json')
  })

  it('handles content as function', async () => {
    const contentFn = () => ({ info: { title: 'Function API' } })
    app.use(
      '/reference',
      apiReference({
        content: contentFn,
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.text).toContain('Function API')
  })

  it('preserves function properties in configuration', async () => {
    app.use(
      '/reference',
      apiReference({
        operationsSorter: (a, b) => a.path.localeCompare(b.path),
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.text).toContain('"operationsSorter": (a, b) => a.path.localeCompare(b.path)')
  })
})

describe('apiReference middleware (fastify)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createTestApp({ fastify: true })
    await app.listen(0)
  })

  afterEach(() => app.close())

  it('should work with fastify adapter', async () => {
    app.use(
      '/reference',
      apiReference({
        content: { info: { title: 'Test API' } },
        withFastify: true,
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.status).toBe(200)
    expect(res.type).toBe('text/html')
    expect(res.text).toContain('<title>Scalar API Reference</title>')
    expect(res.text).toContain('Test API')
  })
})
