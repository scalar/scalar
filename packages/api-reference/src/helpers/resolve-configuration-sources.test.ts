import { describe, expect, it } from 'vitest'

import { normalizeContent } from './normalize-configurations'
import { parseDocumentContent, resolveConfigurationSources } from './resolve-configuration-sources'

describe('resolve-configuration-sources', () => {
  describe('resolveConfigurationSources', () => {
    it('keeps inline YAML as text', () => {
      const resolved = resolveConfigurationSources({ title: 'Galaxy', content: 'openapi: 3.1.0' })

      expect(resolved.galaxy?.source).toEqual({ content: 'openapi: 3.1.0' })
    })

    it('calls a content function but does not parse what it returns', () => {
      const resolved = resolveConfigurationSources({ title: 'Galaxy', content: () => 'openapi: 3.1.0' })

      expect(resolved.galaxy?.source).toEqual({ content: 'openapi: 3.1.0' })
    })

    it('keeps a url source', () => {
      const resolved = resolveConfigurationSources({ title: 'Galaxy', url: 'https://example.com/openapi.json' })

      expect(resolved.galaxy?.source).toEqual({ url: 'https://example.com/openapi.json' })
    })
  })

  describe('parseDocumentContent', () => {
    it('parses JSON', async () => {
      expect(await parseDocumentContent('{"openapi": "3.1.0"}')).toEqual({ openapi: '3.1.0' })
    })

    it('parses YAML', async () => {
      expect(await parseDocumentContent('openapi: 3.1.0\ninfo:\n  title: Galaxy')).toEqual({
        openapi: '3.1.0',
        info: { title: 'Galaxy' },
      })
    })

    it('returns an object unchanged', async () => {
      const document = { openapi: '3.1.0' }
      expect(await parseDocumentContent(document)).toBe(document)
    })

    it('rejects text that opens like JSON but does not parse', async () => {
      await expect(parseDocumentContent('{"openapi": ')).rejects.toThrow()
      expect(() => normalizeContent('{"openapi": ')).toThrow()
    })

    it.each([
      ['a JSON object', '{"openapi": "3.1.0"}'],
      ['a JSON array', '[1, 2]'],
      ['YAML', 'openapi: 3.1.0'],
      ['YAML with a merge key', 'base: &base\n  a: 1\nderived:\n  <<: *base\n  b: 2'],
      ['an empty YAML document', '~'],
    ])('matches normalizeContent for %s', async (_label, content) => {
      expect(await parseDocumentContent(content)).toEqual(normalizeContent(content))
    })
  })
})
