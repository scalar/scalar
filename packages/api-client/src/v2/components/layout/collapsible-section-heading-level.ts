import type { InjectionKey, MaybeRefOrGetter } from 'vue'

/** Heading levels a collapsible section title may use. */
export type CollapsibleSectionHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * Heading level for the title of a CollapsibleSection.
 *
 * A section assumes it sits directly below the page title and renders an `h2`.
 * A parent that renders a title of its own above its sections provides a
 * deeper level, so screen reader users hear the sections as subsections of
 * that title rather than as its siblings.
 */
export const COLLAPSIBLE_SECTION_HEADING_LEVEL: InjectionKey<MaybeRefOrGetter<CollapsibleSectionHeadingLevel>> = Symbol(
  'collapsible-section-heading-level',
)
