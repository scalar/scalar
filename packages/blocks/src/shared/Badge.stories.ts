import type { Meta, StoryObj } from '@storybook/vue3-vite'

import Badge from './Badge.vue'

const meta: Meta<typeof Badge> = {
  title: 'Schema/Badge',
  component: Badge,
  render: () => ({
    components: { Badge },
    template:
      '<div style="padding: 16px; background: var(--scalar-background-1)"><Badge>Plain</Badge> <Badge color="#ffcc00">Gamma</Badge> <Badge color="black">Dark</Badge></div>',
  }),
}

export default meta

type Story = StoryObj<typeof Badge>

export const Colors: Story = {}
