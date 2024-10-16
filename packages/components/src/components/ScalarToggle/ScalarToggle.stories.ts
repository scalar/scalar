import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarToggle from './ScalarToggle.vue'

const meta = {
  component: ScalarToggle,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: (args) => ({
    components: { ScalarToggle },
    setup() {
      const model = ref(args.modelValue)
      return { args, model }
    },
    template: `<ScalarToggle v-bind="args" v-model="model" />`,
  }),
} satisfies Meta<typeof ScalarToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { modelValue: false, disabled: false },
}

export const Disabled: Story = {
  args: { modelValue: false, disabled: true },
}
