import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarSearchInput', () => {
  test.use({ background: true })

  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-empty')
    await page.getByRole('searchbox').fill('my search query')
    await snapshot('2-with-content')
    // Clear button should appear when there is content; click it to clear
    await page.getByRole('button', { name: 'Clear Search' }).click()
    await snapshot('1-empty')
  })

  test('Loading', takeSnapshot)
})
