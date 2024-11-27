import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarToggle from './ScalarToggle.vue'

const meta = {
  component: ScalarToggle,
  tags: ['autodocs'],
  args: { modelValue: false },
  argTypes: {
    label: { control: 'text' },
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

export const Base: Story = { args: { label: 'My Toggle' } }

export const Disabled: Story = {
  args: { disabled: true },
}
