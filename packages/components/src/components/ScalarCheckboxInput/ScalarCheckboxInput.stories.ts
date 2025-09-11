import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarCheckboxInput from './ScalarCheckboxInput.vue'

const meta: Meta = {
  component: ScalarCheckboxInput,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    placeholder: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarCheckboxInput },
    setup() {
      const model = ref(false)
      return { args, model }
    },
    template: `<ScalarCheckboxInput v-model="model" v-bind="args">Click me</ScalarCheckboxInput>`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
