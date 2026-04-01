/**
 * Similar to the copy selector from chrome devtools, this allows you to get a CSS selector for an element
 *
 * Helpful when elements are being re-created and you cannot use a ref for it
 */
export const getSelector = (el: Element | null): string | null => {
  if (!el || !(el instanceof Element)) {
    return null
  }

  const path: string[] = []
  let node: Element | null = el

  while (node instanceof Element) {
    const tag = node.localName

    /**
     * Count same-tag preceding siblings to determine nth-of-type index.
     * Walking backwards is cheaper than counting all siblings and finding our
     * position from the front, since we stop as soon as we reach the start.
     */
    let nth = 1
    let sibling = node.previousElementSibling
    while (sibling) {
      if (sibling.localName === tag) {
        nth++
      }
      sibling = sibling.previousElementSibling
    }

    path.unshift(nth > 1 ? `${tag}:nth-of-type(${nth})` : tag)
    node = node.parentElement
  }

  return path.join(' > ')
}
