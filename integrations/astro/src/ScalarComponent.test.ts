import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'

import ScalarComponent from './ScalarComponent.astro'

/**
 * Astro escapes double quotes inside attribute values as `&#34;` (Astro 6)
 * or `&quot;` (Astro 7). Normalize so assertions hold across versions.
 */
const unescapeQuotes = (html: string) => html.replaceAll('&#34;', '"').replaceAll('&quot;', '"')

describe('ScalarComponent', () => {
  it('attributes the static reference to Astro by default', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ScalarComponent, { props: { configuration: {} } })

    expect(html).toContain('"_integration": "astro"')
  })

  it('preserves an explicit integration override', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ScalarComponent, {
      props: { configuration: { _integration: 'html' } },
    })

    expect(html).toContain('"_integration": "html"')
    expect(html).not.toContain('"_integration": "astro"')
  })

  it('attributes the client-rendered reference to Astro', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ScalarComponent, {
      props: { configuration: {}, renderMode: 'client' },
    })

    expect(unescapeQuotes(html)).toContain('"_integration":"astro"')
  })
})
