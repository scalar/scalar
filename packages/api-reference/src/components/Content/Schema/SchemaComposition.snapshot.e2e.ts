import { takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for the composition renderer.
 *
 * The harness slugifies each entry below (lowercased, spaces to hyphens) and combines it with the
 * describe title into the Storybook id `schema-schemacomposition--<slug>`. So `'One Of'` resolves to
 * `schema-schemacomposition--one-of`, which is the id Storybook derives from the `OneOf` export in
 * `SchemaComposition.stories.ts`. Keep each entry's slug in sync with its story export.
 *
 * Every Schema component in this directory shares one `snapshots/` folder, and baselines are keyed
 * by story name alone (not by component), so story names must be unique across all snapshot suites
 * here.
 */
test.describe('SchemaComposition', () => {
  // Crop to the painted story wrapper (see SchemaComposition.stories.ts), which carries the real
  // Scalar page background (white in light mode) so baselines render opaque instead of transparent.
  test.use({ crop: 'component' })

  ;['One Of', 'Any Of', 'All Of'].forEach((story) => test(story, takeSnapshot))
})
