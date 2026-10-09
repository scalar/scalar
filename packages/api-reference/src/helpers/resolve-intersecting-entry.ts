type IntersectingEntry = {
  /** Id of the navigation entry an observer just reported */
  id: string
  /** Id the sentinel at the start of the document reports */
  documentStartId: string
  /** Distance from the top of the viewport to the sentinel, or `undefined` while it is not rendered */
  documentStartTop: number | undefined
}

/**
 * The navigation entry an intersecting section resolves to.
 *
 * The sentinel at the start of the document and every heading below it have their own
 * `IntersectionObserver`, and the browser delivers their first records in no fixed order, so taking
 * the last one leaves whichever heading happened to arrive last selected. Resolve it from position
 * instead: while the sentinel is still at or below the top of the viewport, nothing above the start
 * of the document has been scrolled past, so every section resolves to the document start. That
 * covers the sections a short document shows all at once, and the ones of a document swapped in
 * under the reader — the sentinel and the introduction sit in the same place across a swap, so
 * their observers have no new record to report. A single pixel of scroll takes the sentinel's top
 * negative and this is inert.
 */
export const resolveIntersectingEntry = ({ id, documentStartId, documentStartTop }: IntersectingEntry): string =>
  documentStartTop !== undefined && documentStartTop >= 0 ? documentStartId : id
