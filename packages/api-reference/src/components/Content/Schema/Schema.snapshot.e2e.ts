import { takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for the schema renderer.
 *
 * The harness slugifies each entry below (lowercased, spaces to hyphens) and combines it with the
 * describe title into the Storybook id `schema-schema--<slug>`. So `'With Required'` resolves to
 * `schema-schema--with-required`, which is the id Storybook derives from the `WithRequired` export in
 * `Schema.stories.ts`. Keep each entry's slug in sync with its story export.
 */
test.describe('Schema', () => {
  // Crop to the painted story wrapper (see Schema.stories.ts), which carries the real Scalar page
  // background (white in light mode) so the baselines render opaque instead of transparent.
  test.use({ crop: 'component' })

  ;['Base', 'With Required', 'Composition'].forEach((story) => test(story, takeSnapshot))
})
