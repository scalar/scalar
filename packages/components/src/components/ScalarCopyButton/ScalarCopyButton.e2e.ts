import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base']

// TODO: Add snapshots
test.describe('ScalarCopyButton', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
