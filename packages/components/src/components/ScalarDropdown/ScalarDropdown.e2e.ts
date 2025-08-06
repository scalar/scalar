import { testComponent } from '@test/testComponent'

testComponent('ScalarDropdown', {
  stories: ['Base', 'Custom Classes'],
  testFn: async ({ page, snapshot }) => {
    await page.getByRole('button', { name: 'Click Me' }).click() // Open the dropdown
    await snapshot() // Take a snapshot of the open state
  },
})
