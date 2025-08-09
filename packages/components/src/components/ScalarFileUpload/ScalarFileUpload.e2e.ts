import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Compact', 'Files', 'Loading', 'Labelled']

test.describe('ScalarFileUpload', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
