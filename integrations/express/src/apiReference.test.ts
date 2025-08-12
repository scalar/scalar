import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { apiReference } from './apiReference'

describe('apiReference', () => {
  it('should handle missing spec content gracefully', async () => {
    const app = express()
    const options = {
      cdn: 'https://cdn.example.com',
    }
    app.use(apiReference(options))

    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.type).toBe('text/html')
    expect(response.text).toContain('<title>Scalar API Reference</title>')
    expect(response.text).toContain('https://cdn.example.com')
    // Ensure no undefined content
    expect(response.text).not.toContain('undefined')
  })

  it('should use default CDN when no CDN is provided', async () => {
    const app = express()
    const options = {
      content: { info: { title: 'Test API' } },
    }
    app.use(apiReference(options))

    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.type).toBe('text/html')
    expect(response.text).toContain('<title>Scalar API Reference</title>')
    expect(response.text).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
  })

  it('does not have the content twice', async () => {
    const app = express()
    app.use(apiReference({ content: { info: { title: 'Test API' } } }))

    const response = await request(app).get('/')
    expect(response.status).toBe(200)

    // Check the title is present
    expect(response.text).toContain('Test API')

    // Check that the title is only present once
    const text = response.text
    const titleCount = (text.match(/Test API/g) || []).length
    expect(titleCount).toBe(1)
  })

  it('keeps the URL in the configuration', async () => {
    const app = express()

    app.use(
      apiReference({
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      }),
    )

    const response = await request(app).get('/')

    // Check the URL is present
    expect(response.text).toContain('https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json')
  })

  it('includes _integration: "express" in configuration', async () => {
    const app = express()
    app.use(apiReference({}))

    const response = await request(app).get('/')
    expect(response.text).toContain('"_integration": "express"')
  })

  it('handles content as function', async () => {
    const app = express()
    const contentFn = () => ({ info: { title: 'Function API' } })
    app.use(apiReference({ content: contentFn }))

    const response = await request(app).get('/')
    expect(response.text).toContain('Function API')
  })

  it('removes spec.content when spec.url is provided', async () => {
    const app = express()
    app.use(
      apiReference({
        url: 'https://example.com/api.json',
        content: { info: { title: 'Test API' } },
      }),
    )

    const response = await request(app).get('/')
    expect(response.text).toContain('https://example.com/api.json')
    expect(response.text).not.toContain('Test API')
  })

  it('sets correct content type and status', async () => {
    const app = express()
    app.use(apiReference({}))

    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.type).toBe('text/html')
  })
})
