import { test } from '@test/helpers'

test.describe('ScalarColorModeToggle', () => {
  test.use({ crop: 'component', scale: 4 })

  test('Button', async ({ page, snapshot }) => {
    await snapshot()
    await page.getByRole('button', { name: 'Set dark mode' }).click()
    await snapshot('pressed')
  })

  test.describe(() => {
    test.use({ background: true })
    test('Icon', async ({ page, snapshot }) => {
      await snapshot()
      await page.getByRole('button', { name: 'Set dark mode' }).click()
      await snapshot('pressed')
    })
  })
})
