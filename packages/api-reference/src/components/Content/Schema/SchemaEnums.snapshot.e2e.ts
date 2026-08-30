import { takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for the enum renderer.
 *
 * The harness slugifies each entry below (lowercased, spaces to hyphens) and combines it with the
 * describe title into the Storybook id `schema-schemaenums--<slug>`. So `'With Descriptions'`
 * resolves to `schema-schemaenums--with-descriptions`, which is the id Storybook derives from the
 * `WithDescriptions` export in `SchemaEnums.stories.ts`. Keep each entry's slug in sync with its
 * story export.
 *
 * Every Schema component in this directory shares one `snapshots/` folder, and baselines are keyed
 * by story name alone (not by component), so story names must be unique across all snapshot suites
 * here. That is why these are `Values`/`With Descriptions`/`Long List` rather than reusing the
 * `Schema` suite's `Base`.
 */
test.describe('SchemaEnums', () => {
  // Crop to the painted story wrapper (see SchemaEnums.stories.ts), which carries the real Scalar
  // page background (white in light mode) so the baselines render opaque instead of transparent.
  test.use({ crop: 'component' })

  ;['Values', 'With Descriptions', 'Long List'].forEach((story) => test(story, takeSnapshot))
})
