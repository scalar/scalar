import { testComponent } from '@test/testComponent'

testComponent('ScalarColorModeToggle', {
  stories: ['Button'],
  crop: true,
  scale: 4,
  testFn: async ({ page, snapshot }) => {
    await snapshot() // Take a snapshot of the default state
    await page.getByRole('button', { name: 'Set dark mode' }).click() // Click the toggle
    await snapshot('pressed') // Take a snapshot of the pressed state
  },
})

testComponent('ScalarColorModeToggle', {
  stories: ['Icon'],
  background: true,
  crop: true,
  scale: 4,
  testFn: async ({ page, snapshot }) => {
    await snapshot() // Take a snapshot of the default state
    await page.getByRole('button', { name: 'Set dark mode' }).click() // Click the toggle
    await snapshot('pressed') // Take a snapshot of the pressed state
  },
})
