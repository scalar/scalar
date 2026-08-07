import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/** A single ancestor in the tag hierarchy leading to the section in view. */
export type Crumb = { id: string; title: string }

/** A placeholder crumb standing in for the hidden middle of a long trail. */
export type EllipsisCrumb = { ellipsis: true; hiddenTitles: string[] }

/** A header-rendering tag paired with the full trail (ancestors plus itself) leading to it. */
export type HeaderTagChain = { id: string; chain: Crumb[] }

/**
 * Whether a tag renders a section header of its own in the given layout. Legacy
 * `x-tagGroups` wrappers only render one in the classic layout; the modern layout
 * flattens them, so a breadcrumb pointing at them there would target no heading.
 */
const rendersTagHeader = (entry: TraversedEntry, layout: 'classic' | 'modern'): boolean =>
  entry.type === 'tag' && (entry.isTagGroup !== true || layout === 'classic')

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
      const chain = rendersTagHeader(entry, layout) ? [...ancestors, { id: entry.id, title: entry.title }] : ancestors

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

/**
 * Every header-rendering tag in document order, each carrying the breadcrumb
 * trail (ancestor tags plus itself) that describes where it sits in the
 * hierarchy. The context bar walks this list against the scroll position to
 * resolve which trail belongs to the section currently pinned beneath it.
 */
export const buildHeaderTagChains = (entries: TraversedEntry[], layout: 'classic' | 'modern'): HeaderTagChain[] => {
  const result: HeaderTagChain[] = []

  const visit = (items: TraversedEntry[], ancestors: Crumb[]): void => {
    for (const entry of items) {
      const isHeader = rendersTagHeader(entry, layout)
      const chain = isHeader ? [...ancestors, { id: entry.id, title: entry.title }] : ancestors

      if (isHeader) {
        result.push({ id: entry.id, chain })
      }

      if ('children' in entry && entry.children !== undefined) {
        visit(entry.children, chain)
      }
    }
  }

  visit(entries, [])

  return result
}
