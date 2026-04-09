import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarSearchResults', () => {
  test.use({ background: true })

  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-default')
    // Hover over the first result to show the hover state
    await page.getByRole('option').nth(0).hover()
    await snapshot('2-hovered')
    // Select the second result
    await page.getByRole('option').nth(1).click()
    await snapshot('3-selected')
  })

  test('No Results', takeSnapshot)
})
