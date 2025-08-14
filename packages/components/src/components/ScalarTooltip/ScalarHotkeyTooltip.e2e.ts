import { takeTooltipSnapshot } from './helpers'
import { test } from '@test/helpers'

const stories = ['Hotkey', 'Label and Hotkey']

test.describe('ScalarTooltip', () => {
  test.use({
    background: true,
    colorModes: ['light', 'dark'],
  })
  stories.forEach((story) => test(story, takeTooltipSnapshot))
})
