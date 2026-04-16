// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import {
  generateBodyScript,
  getJsAsset,
  renderApiReference,
  renderApiReferenceToString,
  serializeConfigToJs,
} from './ssr'

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

      expect(html).not.toMatch(/^<script\b[^>]*>/i)
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

    it('renders array configuration consistently with hydration config', async () => {
      const htmlFromObjectConfig = await renderApiReferenceToString({
        url: 'https://example.com/openapi.json',
      })
      const htmlFromArrayConfig = await renderApiReferenceToString([
        {
          url: 'https://example.com/openapi.json',
        },
      ])

      expect(htmlFromArrayConfig).toBe(htmlFromObjectConfig)
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

    it('ignores non-boolean darkMode values and falls back to matchMedia', () => {
      const script = generateBodyScript({ darkMode: 'true);window.__pwned=1;//' as unknown as boolean })

      expect(script).toContain('matchMedia')
      expect(script).not.toContain('window.__pwned=1')
    })

    it('ignores invalid forceDarkModeState values', () => {
      const script = generateBodyScript({
        forceDarkModeState: `dark');window.__pwned=2;//` as unknown as 'dark' | 'light',
      })

      expect(script).toContain('localStorage')
      expect(script).toContain('matchMedia')
      expect(script).not.toContain('window.__pwned=2')
    })
  })

  describe('renderApiReference', () => {
    it('returns a complete HTML document', async () => {
      const html = await renderApiReference({ config: {}, css: '' })

      expect(html).toContain('<!doctype html>')
      expect(html).toContain('<html')
      expect(html).toContain('</html>')
      expect(html).toContain('<div id="app">')
    })

    it('includes the color mode detection script', async () => {
      const html = await renderApiReference({ config: {}, css: '' })

      expect(html).toContain('document.body.classList')
    })

    it('uses light-mode on body when forceDarkModeState is light', async () => {
      const html = await renderApiReference({ config: { forceDarkModeState: 'light' }, css: '' })

      expect(html).toContain('<body class="light-mode">')
      expect(html).not.toContain('<body class="dark-mode">')
    })

    it('uses light-mode on body when darkMode is false', async () => {
      const html = await renderApiReference({ config: { darkMode: false }, css: '' })

      expect(html).toContain('<body class="light-mode">')
      expect(html).not.toContain('<body class="dark-mode">')
    })

    it('uses config from the first entry for array configuration body class', async () => {
      const html = await renderApiReference({ config: [{ forceDarkModeState: 'light' }], css: '' })

      expect(html).toContain('<body class="light-mode">')
      expect(html).not.toContain('<body class="dark-mode">')
    })

    it('defaults to Scalar API Reference title', async () => {
      const html = await renderApiReference({ config: {}, css: '' })

      expect(html).toContain('<title>Scalar API Reference</title>')
    })

    it('accepts a custom page title', async () => {
      const html = await renderApiReference({ config: {}, pageTitle: 'My API', css: '' })

      expect(html).toContain('<title>My API</title>')
    })

    it('escapes HTML in page title', async () => {
      const html = await renderApiReference({ config: {}, pageTitle: '<script>alert("xss")</script>', css: '' })

      expect(html).not.toContain('<script>alert')
      expect(html).toContain('&lt;script&gt;')
    })

    it('uses custom CSS when provided', async () => {
      const customCss = 'body { background: red; }'
      const html = await renderApiReference({ config: {}, css: customCss })

      expect(html).toContain(customCss)
    })

    it('contains rendered HTML inside the app div', async () => {
      const html = await renderApiReference({ config: {}, css: '' })

      expect(html).toMatch(/<div id="app">.+<\/div>/s)
    })

    it('includes hydration script tags', async () => {
      const html = await renderApiReference({ config: {}, css: '' })

      expect(html).toContain('<script src="/scalar/scalar.js"></script>')
      expect(html).toContain('Scalar.createApiReference')
    })

    it('uses default cdn path', async () => {
      const html = await renderApiReference({ config: {}, css: '' })

      expect(html).toContain('src="/scalar/scalar.js"')
    })

    it('accepts a custom cdn path', async () => {
      const html = await renderApiReference({ config: {}, css: '', cdn: '/custom/path.js' })

      expect(html).toContain('src="/custom/path.js"')
    })

    it('escapes HTML in custom cdn path', async () => {
      const html = await renderApiReference({ config: {}, css: '', cdn: '/custom/"path.js' })

      expect(html).toContain('src="/custom/&quot;path.js"')
      expect(html).not.toContain('src="/custom/"path.js"')
    })

    it('serializes configuration into the hydration script', async () => {
      const html = await renderApiReference({ config: { url: 'https://example.com/api.json' }, css: '' })

      expect(html).toContain('"url": "https://example.com/api.json"')
    })

    it('prevents script breakout in hydration config serialization', async () => {
      const html = await renderApiReference({
        config: {
          title: '</script><script>window.__pwned=1</script>',
        },
        css: '',
      })

      expect(html).not.toContain('</script><script>window.__pwned=1</script>')
      expect(html).toContain(
        '"title": "\\u003c/script\\u003e\\u003cscript\\u003ewindow.__pwned=1\\u003c/script\\u003e"',
      )
    })

    it('preserves top-level function properties in hydration config serialization', async () => {
      const html = await renderApiReference({
        config: {
          url: 'https://example.com/api.json',
          onLoaded: () => console.log('loaded'),
        },
        css: '',
      })

      expect(html).toContain('Scalar.createApiReference')
      expect(html).toContain('"url": "https://example.com/api.json"')
      expect(html).toContain('"onLoaded": () => console.log("loaded")')
    })

    it('serializes function-only configuration as a valid object literal', async () => {
      const html = await renderApiReference({
        config: {
          onLoaded: () => console.log('loaded'),
        },
        css: '',
      })

      expect(html).toContain('"onLoaded": () => console.log("loaded")')
      expect(html).not.toContain('{,')
    })

    it('preserves top-level arrays containing functions in hydration config serialization', () => {
      const result = serializeConfigToJs({
        theme: 'kepler',
        hooks: [
          () => 'ready',
          {
            label: 'stable',
          },
        ],
      })

      expect(result).toContain('"theme": "kepler"')
      expect(result).toContain('"hooks": [() => "ready", {"label":"stable"}]')
    })

    it('escapes script-breaking sequences in serialized function properties', () => {
      // Arrow function whose source contains a </script> payload
      const maliciousFn = () => '</script><script>window.__pwned=3</script>'
      const result = serializeConfigToJs({
        onLoaded: maliciousFn,
      })

      expect(result).not.toContain('</script><script>window.__pwned=3</script>')
      expect(result).toContain('<\\/script>')
    })

    it('escapes script-breaking sequences in serialized array functions', () => {
      // Arrow function whose source contains a </script> payload
      const maliciousFn = () => '</script><script>window.__pwned=4</script>'
      const result = serializeConfigToJs({
        hooks: [maliciousFn],
      })

      expect(result).not.toContain('</script><script>window.__pwned=4</script>')
      expect(result).toContain('<\\/script>')
    })

    it('throws when nested functions would be dropped during hydration serialization', async () => {
      await expect(
        renderApiReference({
          config: {
            metaData: {
              onLoaded: () => console.log('loaded'),
            },
          },
          css: '',
        }),
      ).rejects.toThrow('Cannot serialize function at "metaData.onLoaded" for SSR hydration.')
    })
  })

  describe('getJsAsset', () => {
    it('is a function', () => {
      expect(typeof getJsAsset).toBe('function')
    })

    it('throws when api-reference package.json has no browser entry', async () => {
      vi.resetModules()
      vi.doMock('node:module', () => ({
        createRequire: () => ({
          resolve: () => '/tmp/mock-api-reference/dist/index.js',
        }),
      }))
      vi.doMock('node:fs', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
        return {
          ...actual,
          readFileSync: ((
            path: string,
            options?: BufferEncoding | { encoding?: BufferEncoding | null; flag?: string },
          ) => {
            if (path.endsWith('/tmp/mock-api-reference/package.json')) {
              return JSON.stringify({ name: '@scalar/api-reference' })
            }
            return actual.readFileSync(path, options as never)
          }) as typeof actual.readFileSync,
        }
      })

      const { getJsAsset: getJsAssetUnderTest } = await import('./ssr')
      expect(() => getJsAssetUnderTest()).toThrow('Expected a string "browser" field in package.json.')
    })
  })
})
