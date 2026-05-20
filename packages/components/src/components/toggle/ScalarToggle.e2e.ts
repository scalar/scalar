import { test } from '@test/helpers'

test.describe('ScalarToggle', () => {
  // Constrain the viewport to trigger truncation
  test.use({ viewport: { width: 240, height: 320 } })

  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-untoggled')
    await page.getByRole('switch', { name: 'My Toggle' }).click()
    await snapshot('2-toggled')
  })

  test('Input', async ({ page, snapshot }) => {
    await snapshot('1-untoggled')
    await page.getByLabel('Click me').click()
    await snapshot('2-toggled')
  })

  test('Grouped', async ({ page, snapshot }) => {
    await snapshot('1-untoggled')

    await page.getByRole('switch').nth(2).click()
    await snapshot('2-toggled')

    await page.getByRole('switch').nth(3).click()
    await snapshot('3-retoggled')
  })
})
