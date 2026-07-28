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
