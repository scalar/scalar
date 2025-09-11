import { test } from '@test/helpers'

test.describe('ScalarCheckboxInput', () =>
  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-unchecked')
    await page.getByText('Click me').click()
    await snapshot('2-checked')
  }))
