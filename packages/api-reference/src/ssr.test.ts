import { describe, expect, it } from 'vitest'

import { generateBodyScript, renderApiReferenceToString, resolveBodyClass } from './ssr'

describe('ssr', () => {
  describe('renderApiReferenceToString', () => {
    it('returns an object with html, bodyClass, and bodyScript', async () => {
      const result = await renderApiReferenceToString({})

      expect(result).toHaveProperty('html')
      expect(result).toHaveProperty('bodyClass')
      expect(result).toHaveProperty('bodyScript')
    })

    it('returns a non-empty html string with minimal config', async () => {
      const { html } = await renderApiReferenceToString({})

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains expected HTML structure', async () => {
      const { html } = await renderApiReferenceToString({})

      expect(html).toContain('<div')
    })

    it('renders with inline OpenAPI content', async () => {
      const { html } = await renderApiReferenceToString({
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
      const { html } = await renderApiReferenceToString({
        url: 'https://example.com/openapi.json',
      })

      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('renders with a theme option', async () => {
      const { html } = await renderApiReferenceToString({
        theme: 'purple',
      })

      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })
  })

  describe('resolveBodyClass', () => {
    it('defaults to light-mode', () => {
      expect(resolveBodyClass({})).toBe('light-mode')
    })

    it('returns dark-mode when darkMode is true', () => {
      expect(resolveBodyClass({ darkMode: true })).toBe('dark-mode')
    })

    it('returns light-mode when darkMode is false', () => {
      expect(resolveBodyClass({ darkMode: false })).toBe('light-mode')
    })

    it('returns dark-mode when forceDarkModeState is dark', () => {
      expect(resolveBodyClass({ forceDarkModeState: 'dark' })).toBe('dark-mode')
    })

    it('returns light-mode when forceDarkModeState is light', () => {
      expect(resolveBodyClass({ forceDarkModeState: 'light' })).toBe('light-mode')
    })

    it('forceDarkModeState takes priority over darkMode', () => {
      expect(resolveBodyClass({ forceDarkModeState: 'light', darkMode: true })).toBe('light-mode')
      expect(resolveBodyClass({ forceDarkModeState: 'dark', darkMode: false })).toBe('dark-mode')
    })

    it('handles array configurations', () => {
      expect(resolveBodyClass([{ darkMode: true }])).toBe('dark-mode')
      expect(resolveBodyClass([{ forceDarkModeState: 'dark' }])).toBe('dark-mode')
    })
  })

  describe('generateBodyScript', () => {
    it('returns a script tag', () => {
      const script = generateBodyScript({})

      expect(script).toContain('<script>')
      expect(script).toContain('</script>')
    })

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
