import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'

import ClassicLayout from './ClassicLayout.vue'

const tag: TraversedTag = {
  type: 'tag',
  id: 'api-1/tag/planets',
  title: 'Planets',
  name: 'planets',
  description: 'Everything about planets.',
  children: [],
  isGroup: false,
}

/** The deepest nesting of `button` elements the markup reaches. */
const maxButtonDepth = (html: string): number => {
  let depth = 0
  let deepest = 0

  for (const match of html.matchAll(/<(\/?)button[\s/>]/g)) {
    depth += match[1] ? -1 : 1
    deepest = Math.max(deepest, depth)
  }

  return deepest
}

/**
 * A `button` start tag inside an open `button` implies the end tag for the outer one, so the
 * parser re-parents the inner control as a sibling and the hydrated DOM can never match the
 * rendered tree. The tag's accordion button and the copy-link button in its title must
 * therefore stay separate buttons.
 */
describe('ClassicLayout.ssr', () => {
  it('renders the tag header without nesting buttons', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(ClassicLayout, { tag, isCollapsed: false, eventBus: null }) }),
    )

    expect(html).toContain('Planets')
    expect(maxButtonDepth(html)).toBe(1)
  })
})
