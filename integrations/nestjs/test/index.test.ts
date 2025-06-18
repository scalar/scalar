import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from './app.factory'
import request from 'supertest'
import { apiReference } from '../src'
import type { INestApplication } from '@nestjs/common'

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
    expect(res.text).toContain('--scalar-color-1: #2a2f45;')
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
    expect(res.text).not.toContain('--scalar-color-1: #2a2f45;')
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
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      }),
    )

    const res = await request(app.getHttpServer()).get('/reference')

    expect(res.text).toContain('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json')
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
