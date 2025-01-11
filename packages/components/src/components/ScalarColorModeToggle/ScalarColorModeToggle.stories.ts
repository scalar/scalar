import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarColorModeToggle from './ScalarColorModeToggle.vue'
import ScalarColorModeToggleButton from './ScalarColorModeToggleButton.vue'

const meta: Meta<typeof ScalarColorModeToggle> = {
  component: ScalarColorModeToggle,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const ButtonOnly: Story = {
  argTypes: {
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: { ScalarColorModeToggleButton },
    setup() {
      return { args }
    },
    template: `<ScalarColorModeToggleButton v-bind="args" />`,
  }),
}
