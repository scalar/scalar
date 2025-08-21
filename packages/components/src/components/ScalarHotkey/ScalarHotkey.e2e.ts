import { test, type Device } from '@test/helpers'

const stories = ['Base', 'Multiple Modifiers']

const devices: Device[] = ['Safari', 'Chrome']

test.describe('ScalarHotkey', () => {
  test.use({ viewport: { width: 120, height: 60 }, background: true })
  devices.forEach((device) => {
    test.describe(device, () => {
      test.use({ component: 'ScalarHotkey', device })
      stories.forEach((story) => test(story, ({ snapshot }) => snapshot(device)))
    })
  })
})
