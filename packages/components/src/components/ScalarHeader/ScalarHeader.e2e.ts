import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Responsive', 'With Menu']

test.describe('ScalarHeader', () => {
  stories.forEach((story) => test(story, takeSnapshot))
})
