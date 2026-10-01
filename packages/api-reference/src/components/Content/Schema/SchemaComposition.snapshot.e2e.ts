import { expect, takeSnapshot, test } from '@test/helpers'

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

  ;['One Of', 'One Of All Of Variant', 'Any Of', 'All Of'].forEach((story) => test(story, takeSnapshot))

  test('One Of Long Discriminator', async ({ page }) => {
    const picker = page.getByRole('button', { name: /^One of terrestrial/ })
    const keyword = picker.getByText('One of', { exact: true })
    const label = picker.getByText('terrestrial, gas_giant, ice_giant, dwarf, super_earth · Planet', { exact: true })

    const keywordBox = await keyword.boundingBox()
    const labelBox = await label.boundingBox()
    const caretBox = await picker.locator('[aria-hidden="true"]').first().boundingBox()
    const lineHeight = await keyword.evaluate((element) => Number.parseFloat(getComputedStyle(element).lineHeight))

    expect(keywordBox!.height).toBeCloseTo(lineHeight, 1)
    expect(labelBox!.height).toBeGreaterThan(keywordBox!.height)
    expect(labelBox!.y).toBeCloseTo(keywordBox!.y, 1)
    expect(caretBox!.y + caretBox!.height / 2).toBeCloseTo(keywordBox!.y + keywordBox!.height / 2, 1)

    await picker.click()
    await page.getByRole('listbox').press('ArrowDown')
    await page.getByRole('listbox').press('Enter')
    await expect(page.getByRole('button', { name: 'One of moon · Satellite', exact: true })).toBeVisible()
  })
})
