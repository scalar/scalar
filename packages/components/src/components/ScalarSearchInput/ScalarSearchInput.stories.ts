import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { useLoadingState } from '../ScalarLoading'
import ScalarSearchInput from './ScalarSearchInput.vue'

const meta = {
  component: ScalarSearchInput,
  tags: ['autodocs'],
  argTypes: {},
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
      const loadingState = useLoadingState()
      loadingState.startLoading()
      return { loadingState }
    },
    template: `<ScalarSearchInput modelValue="My search query" :loading="loadingState" />`,
  }),
}
