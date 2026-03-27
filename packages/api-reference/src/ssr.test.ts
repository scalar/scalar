import { describe, expect, it } from 'vitest'

import { generateBodyScript, renderApiReferenceToString } from './ssr'

describe('ssr', () => {
  describe('renderApiReferenceToString', () => {
    it('returns a non-empty html string', async () => {
      const html = await renderApiReferenceToString({})

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('does not contain an inline script tag', async () => {
      const html = await renderApiReferenceToString({})

      expect(html).not.toMatch(/^<script>/)
      expect(html).not.toContain('<script>')
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

  describe('generateBodyScript', () => {
    it('uses matchMedia when no config is set', () => {
      const script = generateBodyScript({})

      expect(script).toContain('matchMedia')
      expect(script).toContain('prefers-color-scheme:dark')
    })

    it('checks localStorage when not forced', () => {
      const script = generateBodyScript({})

      expect(script).toContain('localStorage')
      expect(script).toContain('colorMode')
    })

    it('does not check localStorage or matchMedia when forceDarkModeState is set', () => {
      const scriptDark = generateBodyScript({ forceDarkModeState: 'dark' })

      expect(scriptDark).not.toContain('localStorage')
      expect(scriptDark).not.toContain('matchMedia')
      expect(scriptDark).toContain('dark-mode')

      const scriptLight = generateBodyScript({ forceDarkModeState: 'light' })

      expect(scriptLight).not.toContain('localStorage')
      expect(scriptLight).not.toContain('matchMedia')
      expect(scriptLight).toContain('light-mode')
    })

    it('uses darkMode config as fallback instead of matchMedia', () => {
      const script = generateBodyScript({ darkMode: true })

      expect(script).not.toContain('matchMedia')
      expect(script).toContain('set(true)')
    })

    it('handles array configurations', () => {
      const script = generateBodyScript([{ forceDarkModeState: 'dark' }])

      expect(script).toContain('dark-mode')
      expect(script).not.toContain('localStorage')
    })
  })
})
