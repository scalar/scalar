import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'

import ScalarComponent from './ScalarComponent.astro'

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

    expect(html).toContain('&#34;_integration&#34;:&#34;astro&#34;')
  })
})
