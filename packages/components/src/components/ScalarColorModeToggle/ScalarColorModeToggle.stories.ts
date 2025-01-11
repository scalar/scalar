import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import DarkModeToggle from './DarkModeToggle.vue'
import ScalarColorModeToggle from './ScalarColorModeToggle.vue'

const meta: Meta<typeof ScalarColorModeToggle> = {
  component: ScalarColorModeToggle,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Old: Story = {
  render: (args) => ({
    components: { DarkModeToggle },
    setup() {
      const isDarkMode = ref(false)
      return { args, isDarkMode }
    },
    template: `
<DarkModeToggle v-bind="args" :isDarkMode="isDarkMode" @toggleDarkMode="isDarkMode = !isDarkMode" />
    `,
  }),
}
