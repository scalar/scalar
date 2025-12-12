import { test } from '@test/helpers'

test.describe('ScalarSidebar', () => {
  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-collapsed')

    await page.getByRole('button', { name: 'Level 1 Group' }).click()
    await page.getByRole('button', { name: 'Level 2 Group' }).click()

    await snapshot('2-expanded')
  })
  test('Themed', async ({ page, snapshot }) => {
    await page.getByRole('button', { name: 'Level 1 Group' }).click()
    await page.getByRole('button', { name: 'Level 2 Group' }).click()
    await page.mouse.move(0, 0) // Move the mouse to the top of the page to avoid hover states
    await snapshot('1-base')
    await page.getByRole('button', { name: 'Subitem 3' }).hover()
    await snapshot('2-hover')
    await page.getByRole('button', { name: 'Subitem 3' }).click()
    await snapshot('3-selected')
  })

  test('Discrete Groups', async ({ page, snapshot }) => {
    await snapshot('1-collapsed')

    await page.getByRole('button', { name: 'Open Level 1 Group' }).click()
    await snapshot('2-expanded')

    await page.getByRole('button', { name: 'Level 2 Group', exact: true }).click()
    await snapshot('3-selected')
  })
})
