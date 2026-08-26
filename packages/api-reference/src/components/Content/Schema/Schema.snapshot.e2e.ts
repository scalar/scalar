import { takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for the schema renderer.
 *
 * Each story name here has to match a story exported from `Schema.stories.ts`; the harness maps the
 * describe title (`Schema`) plus the test title to the Storybook id `schema-schema--<story>`.
 */
test.describe('Schema', () => {
  ;['Base', 'With Required', 'Composition'].forEach((story) => test(story, takeSnapshot))
})
