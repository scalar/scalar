import { testComponent } from '@test/testComponent'

testComponent('ScalarColorModeToggle', {
  stories: ['Button', 'Icon'],
  testFn: async ({ page, snapshot }) => {
    await snapshot() // Take a snapshot of the default state
    await page.getByRole('button', { name: 'Set dark mode' }).click() // Click the toggle
    await snapshot('pressed') // Take a snapshot of the pressed state
  },
})
