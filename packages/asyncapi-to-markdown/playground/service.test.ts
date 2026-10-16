import { describe, expect, it } from 'vitest'

import { createExportService } from './service'

describe('service', () => {
  it('exports every advertised page with linked and self-contained modes', async () => {
    const service = createExportService()
    for (const document of ['events', 'shared']) {
      const manifest = await service('/__markdown/document', `document=${document}`)
      if (typeof manifest === 'string' || !('pages' in manifest)) {
        throw new Error('Expected a manifest')
      }
      for (const [index] of manifest.pages.entries()) {
        for (const linked of [false, true]) {
          const result = await service('/__markdown/render', `document=${document}&page=${index}&linked=${linked}`)
          if (typeof result === 'string' || !('markdown' in result)) {
            throw new Error('Expected an export')
          }
          expect(result.bytes).toBe(Buffer.byteLength(result.markdown))
          expect(result.markdown.startsWith('#') || result.markdown.startsWith('<a ')).toBe(true)
          expect(result.html).not.toContain('<script')
        }
      }
    }
  })

  it('returns the same complete Markdown from the text endpoint', async () => {
    const service = createExportService()
    const result = await service('/__markdown/render', 'document=events')
    if (typeof result === 'string' || !('markdown' in result)) {
      throw new Error('Expected an export')
    }
    expect(await service('/llms.txt', 'document=events')).toBe(result.markdown)
    await expect(service('/__markdown/render', 'document=missing')).rejects.toThrow('Unknown example')
    await expect(service('/__markdown/render', 'page=-1')).rejects.toThrow('Unknown page')
  })
})
