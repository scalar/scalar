import { test } from '@test/helpers'

const stories = ['Base', 'JSON String', 'Bordered', 'Single Line', 'Ligatures']

test.describe('ScalarCodeBlock', () => {
  test.use({ background: true })
  stories.forEach((story) =>
    test(story, async ({ snapshot }) => {
      await snapshot(undefined, { maxDiffPixelRatio: 0.015 })
    }),
  )
})
