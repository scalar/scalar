import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Multiple Modifiers']

test.describe('ScalarHotkey', () => {
  test.use({ background: true }), stories.forEach((story) => test(story, takeSnapshot))
})
