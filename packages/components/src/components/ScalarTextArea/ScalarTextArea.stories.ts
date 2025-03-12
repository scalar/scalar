import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarTextArea from './ScalarTextArea.vue'

const meta: Meta = {
  component: ScalarTextArea,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    placeholder: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarTextArea },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: `<ScalarTextArea v-model="model" v-bind="args" />`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const WithMaxHeight: Story = {
  args: {
    class: 'max-h-20',
  },
}
