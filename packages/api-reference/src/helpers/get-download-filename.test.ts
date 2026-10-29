import { describe, expect, it } from 'vitest'

import { getDownloadFilename } from './get-download-filename'

describe('get-download-filename', () => {
  it('uses a configured slug', () => {
    expect(getDownloadFilename({ slug: 'galaxy', isSlugGenerated: false, title: 'Scalar Galaxy' })).toBe('galaxy')
  })

  it('uses the slugified document title when the slug is generated', () => {
    expect(getDownloadFilename({ slug: 'api-1', isSlugGenerated: true, title: 'Projecto Colibri API' })).toBe(
      'projecto-colibri-api',
    )
  })

  it('falls back to openapi when the title slugifies to an empty string', () => {
    expect(getDownloadFilename({ slug: 'api-1', isSlugGenerated: true, title: '🚀 !!!' })).toBe('openapi')
  })

  it('falls back to openapi when there is no title', () => {
    expect(getDownloadFilename({ slug: 'api-1', isSlugGenerated: true, title: undefined })).toBe('openapi')
  })

  it('uses the document title when there is no active configuration', () => {
    expect(getDownloadFilename({ slug: undefined, isSlugGenerated: undefined, title: 'Scalar Galaxy' })).toBe(
      'scalar-galaxy',
    )
  })
})
