import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Line Numbers', 'JSON String']

test.describe('ScalarCodeBlock', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
