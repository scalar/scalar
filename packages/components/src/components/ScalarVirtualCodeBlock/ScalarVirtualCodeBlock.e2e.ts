import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Copy Always', 'No Copy']

test.describe('ScalarVirtualCodeBlock', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
