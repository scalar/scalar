import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

import Badge from './Badge.vue'

const meta: Meta<typeof Badge> = {
  title: 'Schema/Badge',
  component: Badge,
  render: () => ({
    components: { Badge },
    setup: () => ({ color: ref<string | undefined>('#ffcc00') }),
    template: `
      <div style="padding: 16px; background: var(--scalar-background-1)">
        <Badge>Plain</Badge>
        <Badge :color="color">Gamma</Badge>
        <Badge color="black">Dark</Badge>
        <button @click="color = 'black'">Use black</button>
        <button @click="color = undefined">Use theme color</button>
      </div>
    `,
  }),
}

export default meta

type Story = StoryObj<typeof Badge>

export const Colors: Story = {}
