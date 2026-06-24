import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarBadge from './ScalarBadge.vue'

/**
 * A small rounded label for short metadata like versions, HTTP methods, or tags.
 */
const meta = {
  component: ScalarBadge,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarBadge },
    setup: () => ({ args }),
    template: `<ScalarBadge v-bind="args">Badge</ScalarBadge>`,
  }),
} satisfies Meta<typeof ScalarBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Colored: Story = {
  args: { color: '#1763a6' },
}

export const Variants: Story = {
  render: () => ({
    components: { ScalarBadge },
    template: `
      <div class="flex flex-wrap gap-2">
        <ScalarBadge>default</ScalarBadge>
        <ScalarBadge class="text-green">green</ScalarBadge>
        <ScalarBadge class="text-orange">orange</ScalarBadge>
        <ScalarBadge class="text-red">red</ScalarBadge>
        <ScalarBadge class="text-yellow">yellow</ScalarBadge>
        <ScalarBadge class="text-purple">purple</ScalarBadge>
      </div>`,
  }),
}
