import { describe, expect, it } from 'vitest'

import { createExportService } from './service'

describe('service', () => {
  it.each([
    { document: 'events', linked: false },
    { document: 'events', linked: true },
    { document: 'shared', linked: false },
    { document: 'shared', linked: true },
  ])('exports every advertised page for $document with linked=$linked', async ({ document, linked }) => {
    const service = createExportService()
    const manifest = await service('/__markdown/document', `document=${document}`)
    if (typeof manifest === 'string' || !('pages' in manifest)) {
      throw new Error('Expected a manifest')
    }
    for (const [index] of manifest.pages.entries()) {
      const result = await service('/__markdown/render', `document=${document}&page=${index}&linked=${linked}`)
      if (typeof result === 'string' || !('markdown' in result)) {
        throw new Error('Expected an export')
      }
      expect(result.bytes).toBe(Buffer.byteLength(result.markdown))
      expect(result.markdown.startsWith('#') || result.markdown.startsWith('<a ')).toBe(true)
      expect(result.html).not.toContain('<script')
    }
    // About 150 renders with a preview each, including every page of the 60-operation benchmark
    // document. That fits the 5 s default on an idle machine but not reliably on a busy CI runner.
  }, 30_000)

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
