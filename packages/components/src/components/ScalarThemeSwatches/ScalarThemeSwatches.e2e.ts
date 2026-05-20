import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarThemeSwatches', () => {
  test.use({ background: true, viewport: { width: 720, height: 480 }, colorModes: ['light', 'dark'] })
  test('Base', takeSnapshot)
})
