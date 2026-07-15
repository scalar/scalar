import { takeSnapshot, test, themes } from '@test/helpers'

test.describe('ScalarCard', () => {
  ;['Base', 'With Actions', 'Minimal'].forEach((story) => test(story, takeSnapshot))

  /**
   * The card is the only component whose sections inherit their corners from the parent via
   * rounded-t-[inherit] and rounded-b-[inherit], so it is what proves the derived --scalar-radius-xl
   * reaches nested elements rather than stopping at the container.
   */
  themes.forEach((theme) =>
    test.describe(`Theme ${theme}`, () => {
      test.use({ component: 'ScalarCard', theme })

      test('With Actions', takeSnapshot)
    }),
  )
})
