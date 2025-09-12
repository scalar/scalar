import { test } from '@test/helpers'

test.describe('ScalarCheckboxInput', () => {
  // Constrain the viewport to trigger truncation
  test.use({ viewport: { width: 240, height: 320 } })

  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-unchecked')
    await page.getByLabel('Click me').click({ force: true })
    await snapshot('2-checked')
  })

  const stories = ['Checkboxes', 'Radios']

  stories.forEach((story) => {
    test(story, async ({ page, snapshot }) => {
      const role = story === 'Checkboxes' ? 'checkbox' : 'radio'
      await snapshot('1-unchecked')

      await page.getByRole(role).nth(2).click({ force: true })
      await snapshot('2-checked')

      await page.getByRole(role).nth(3).click({ force: true })
      await snapshot('3-rechecked')
    })
  })
})
