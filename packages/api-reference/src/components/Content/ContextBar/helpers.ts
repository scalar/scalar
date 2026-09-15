import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/** A single ancestor in the tag hierarchy leading to the section in view. */
export type Crumb = { id: string; title: string }

/** A placeholder crumb standing in for the hidden middle of a long trail. */
export type EllipsisCrumb = { ellipsis: true; hiddenTitles: string[] }

/** Narrow a rendered crumb to the collapsed-middle placeholder. */
export const isEllipsis = (crumb: Crumb | EllipsisCrumb): crumb is EllipsisCrumb => 'ellipsis' in crumb

/**
 * Collapse the middle of a trail to `first … secondLast last`.
 *
 * Only the middle is folded away: the root gives the top-level context and the
 * last two keep the immediate parent and current section visible. Trails with no
 * real middle to hide (fewer than four crumbs) are returned untouched.
 */
export const collapseTrail = (chain: Crumb[]): (Crumb | EllipsisCrumb)[] => {
  if (chain.length < 4) {
    return chain
  }

  const [head] = chain
  const tail = chain.slice(-2)
  const hidden = chain.slice(1, -2)

  return [...(head ? [head] : []), { ellipsis: true, hiddenTitles: hidden.map((crumb) => crumb.title) }, ...tail]
}

/**
 * Whether the navigation contains nested tags that render their own headings.
 * Legacy tag-group wrappers only render headings in the classic layout, so they
 * do not reserve an empty context bar in the modern layout.
 */
export const hasRenderableTagHierarchy = (entries: TraversedEntry[], layout: 'classic' | 'modern'): boolean => {
  return getInitialContextChain(entries, layout).length >= 2
}

/**
 * Find the first nested tag trail to show before scrolling selects a section.
 * This keeps the context bar useful during the Introduction instead of leaving
 * its reserved space empty.
 */
export const getInitialContextChain = (entries: TraversedEntry[], layout: 'classic' | 'modern'): Crumb[] => {
  const visit = (items: TraversedEntry[], ancestors: Crumb[]): Crumb[] => {
    for (const entry of items) {
      const rendersHeading = entry.type === 'tag' && (entry.isTagGroup !== true || layout === 'classic')
      const chain = rendersHeading ? [...ancestors, { id: entry.id, title: entry.title }] : ancestors

      if (chain.length >= 2) {
        return chain
      }

      if ('children' in entry && entry.children !== undefined) {
        const nestedChain = visit(entry.children, chain)
        if (nestedChain.length >= 2) {
          return nestedChain
        }
      }
    }

    return []
  }

  return visit(entries, [])
}
