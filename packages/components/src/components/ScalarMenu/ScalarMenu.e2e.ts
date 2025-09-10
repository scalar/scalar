import { test } from '@test/helpers'

test.describe('ScalarMenu', () => {
  test('Base', async ({ page, snapshot }) => {
    // Open the dropdown
    await page.getByRole('button', { expanded: false }).click()
    await snapshot()
  })
  test('Team Picker', async ({ page, snapshot }) => {
    // Open the dropdown
    await page.getByRole('button', { expanded: false }).click()
    await snapshot('1')

    await page.getByRole('menuitem', { name: 'Change team' }).click()
    await snapshot('2')
  })
})
