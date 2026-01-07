import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

import { useLoadingState } from '../ScalarLoading'
import ScalarSearchInput from './ScalarSearchInput.vue'

const meta = {
  component: ScalarSearchInput,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarSearchInput },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: `<ScalarSearchInput v-bind="args" v-model="model" />`,
  }),
} satisfies Meta<typeof ScalarSearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Loading: Story = {
  render: () => ({
    components: { ScalarSearchInput },
    setup() {
      const loader = useLoadingState()
      loader.start()
      return { loader }
    },
    template: `<ScalarSearchInput modelValue="My search query" :loader />`,
  }),
}

export const CustomClasses: Story = {
  args: { class: 'border-red' },
}
