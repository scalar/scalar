import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Multiple Modifiers']

test.describe('ScalarHotkey', () => {
  test.use({ viewport: { width: 120, height: 60 }, background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
