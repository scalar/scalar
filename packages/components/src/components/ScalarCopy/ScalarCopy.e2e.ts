import { test } from '@test/helpers'

const stories = ['Base']

test.use({
  viewport: { width: 240, height: 160 },
  background: true,
})

test.describe('ScalarCopy', () => {
  stories.forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      await snapshot('1-base')
      await page.getByRole('button', { name: 'Copy' }).hover()
      await snapshot('2-hover')
      await page.getByRole('button', { name: 'Copy' }).click()
      await snapshot('3-clicked')
    }),
  )
})
