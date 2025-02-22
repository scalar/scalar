import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarVirtualText from './ScalarVirtualText.vue'

const meta = {
  component: ScalarVirtualText,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
    lineHeight: { control: 'number' },
  },
  render: (args) => ({
    components: { ScalarVirtualText },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 300px; width: 400px; border: 1px solid #ccc;">
        <ScalarVirtualText v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof ScalarVirtualText>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {
    text: `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna 
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur 
    sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`.repeat(200),
    lineHeight: 20,
  },
}
