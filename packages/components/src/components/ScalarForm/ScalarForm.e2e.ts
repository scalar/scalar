import { takeSnapshot, test } from '@test/helpers'

const stories = ['With Sections', 'With Fields', 'With Errors']

test.describe('ScalarForm', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))
})
