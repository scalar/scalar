import type { UseSeoMetaInput } from '@unhead/vue'
import { useSeoMeta as unheadUseSeoMeta } from '@unhead/vue'
import { createHead, renderSSRHead } from '@unhead/vue/server'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'

import { useSeoMeta } from './unhead'

const sampleInput: UseSeoMetaInput = {
  title: 'Scalar',
  titleTemplate: '%s | API Reference',
  description: 'Beautiful API references',
  ogTitle: 'Scalar API Reference',
  ogDescription: 'Beautiful API references',
  ogImage: 'https://example.com/preview.png',
  twitterCard: 'summary_large_image',
}

/** Apply some SEO meta with the given composable and render the resulting head as SSR markup. */
const renderHeadWith = async (apply: (input: UseSeoMetaInput) => void) => {
  const head = createHead()
  const app = createApp({ render: () => null })
  app.use(head)

  app.runWithContext(() => apply(sampleInput))

  return await renderSSRHead(head)
}

describe('useSeoMeta', () => {
  it('produces the same head tags as @unhead/vue useSeoMeta', async () => {
    const ours = await renderHeadWith(useSeoMeta)
    const reference = await renderHeadWith(unheadUseSeoMeta)

    expect(ours.headTags).toBe(reference.headTags)
  })

  it('renders the expected SEO meta tags', async () => {
    const { headTags } = await renderHeadWith(useSeoMeta)

    expect(headTags).toContain('<title>Scalar | API Reference</title>')
    expect(headTags).toContain('name="description" content="Beautiful API references"')
    expect(headTags).toContain('property="og:title" content="Scalar API Reference"')
  })

  it('does nothing when no head is provided', () => {
    const app = createApp({ render: () => null })

    // Without an installed head there is no injection context to push tags into, so this should
    // simply be a no-op instead of throwing.
    expect(() => app.runWithContext(() => useSeoMeta(sampleInput))).not.toThrow()
  })
})
