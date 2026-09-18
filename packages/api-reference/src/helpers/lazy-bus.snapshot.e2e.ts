import { takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for the sticky-header scroll helpers in lazy-bus.ts.
 *
 * The harness slugifies each entry (lowercased, spaces to hyphens) and combines it with the
 * describe title into the Storybook id `schema-lazybus--<slug>`.
 *
 * - `StickyHeaderOffset` → `schema-lazybus--sticky-header-offset`
 * - `ScrollToElement`    → `schema-lazybus--scroll-to-element`
 *
 * Keep each entry's slug in sync with its export in `lazy-bus.stories.ts`.
 */
test.describe('LazyBus', () => {
  test.use({ crop: 'component' })

  ;['Sticky Header Offset', 'Scroll To Element'].forEach((story) => test(story, takeSnapshot))
})
