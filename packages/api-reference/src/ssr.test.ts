import { describe, expect, it } from 'vitest'

import { renderApiReferenceToString } from './ssr'

describe('ssr', () => {
  describe('renderApiReferenceToString', () => {
    it('returns a non-empty string with minimal config', async () => {
      const html = await renderApiReferenceToString({})

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains expected HTML structure', async () => {
      const html = await renderApiReferenceToString({})

      expect(html).toContain('<div')
    })

    it('renders with inline OpenAPI content', async () => {
      const html = await renderApiReferenceToString({
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {},
        }),
      })

      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('renders with a URL config', async () => {
      const html = await renderApiReferenceToString({
        url: 'https://example.com/openapi.json',
      })

      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('renders with a theme option', async () => {
      const html = await renderApiReferenceToString({
        theme: 'purple',
      })

      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })
  })
})
