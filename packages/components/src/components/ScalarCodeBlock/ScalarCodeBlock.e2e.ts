import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'JSON String', 'Bordered', 'Single Line']

test.describe('ScalarCodeBlock', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
