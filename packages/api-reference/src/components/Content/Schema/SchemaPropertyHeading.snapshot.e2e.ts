import { takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for the property heading renderer.
 *
 * The harness slugifies each entry below (lowercased, spaces to hyphens) and combines it with the
 * describe title into the Storybook id `schema-schemapropertyheading--<slug>`. So `'String Pattern'`
 * resolves to `schema-schemapropertyheading--string-pattern`, which is the id Storybook derives from
 * the `StringPattern` export in `SchemaPropertyHeading.stories.ts`. Keep each entry's slug in sync
 * with its story export.
 *
 * Every Schema component in this directory shares one `snapshots/` folder, and baselines are keyed
 * by story name alone (not by component), so story names must be unique across all snapshot suites
 * here.
 */
test.describe('SchemaPropertyHeading', () => {
  // Crop to the painted story wrapper (see SchemaPropertyHeading.stories.ts), which carries the real
  // Scalar page background (white in light mode) so baselines render opaque instead of transparent.
  test.use({ crop: 'component' })

  ;['Constraints', 'String Pattern', 'Deprecated'].forEach((story) => test(story, takeSnapshot))
})
