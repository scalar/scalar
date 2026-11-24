import { expect, takeSnapshot, test } from '@test/helpers'

/**
 * Visual snapshots for a single property row.
 *
 * The harness slugifies each entry below (lowercased, spaces to hyphens) and combines it with the
 * describe title into the Storybook id `schema-schemaproperty--<slug>`. So `'Nested Object'` resolves
 * to `schema-schemaproperty--nested-object`, which is the id Storybook derives from the `NestedObject`
 * export in `SchemaProperty.stories.ts`. Keep each entry's slug in sync with its story export.
 *
 * Every Schema component in this directory shares one `snapshots/` folder, and baselines are keyed
 * by story name alone (not by component), so story names must be unique across all snapshot suites
 * here.
 */
test.describe('SchemaProperty', () => {
  // Crop to the painted story wrapper (see SchemaProperty.stories.ts), which carries the real Scalar
  // page background (white in light mode) so baselines render opaque instead of transparent.
  test.use({ crop: 'component' })

  ;['Described', 'Nested Object', 'Array Of Objects'].forEach((story) => test(story, takeSnapshot))

  test('Collapsed Preview With Copy Link', async ({ page, snapshot }) => {
    const copyLink = page.getByRole('button', { name: 'Copy link to atmosphere', exact: true })

    await snapshot()

    // The focus ring shows the hit box overhanging the end of the line
    await page.getByRole('button', { name: 'atmosphere', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(copyLink).toBeFocused()
    await snapshot('focused')
  })
})
