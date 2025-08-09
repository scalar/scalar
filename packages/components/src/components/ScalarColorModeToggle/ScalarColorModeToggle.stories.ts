import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarColorModeToggle from './ScalarColorModeToggle.vue'
import ScalarColorModeToggleButton from './ScalarColorModeToggleButton.vue'
import ScalarColorModeToggleIcon from './ScalarColorModeToggleIcon.vue'

const meta: Meta<typeof ScalarColorModeToggle> = {
  component: ScalarColorModeToggle,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['switch', 'icon'],
    },
    class: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Button: Story = {
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
    template: `
      <div class="w-fit p-2">
        <ScalarColorModeToggleButton v-bind="args" />
      </div>
    `,
  }),
}

export const Icon: Story = {
  argTypes: {
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: { ScalarColorModeToggleIcon },
    setup() {
      const mode = ref<'light' | 'dark'>('light')
      return { args, mode }
    },
    template: `
      <div class="w-fit p-2">
        <ScalarColorModeToggleIcon :mode="mode" v-bind="args" @click="mode = mode === 'light' ? 'dark' : 'light'" />
      </div>
    `,
  }),
}
