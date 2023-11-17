import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarTextField from './ScalarTextField.vue'

const meta = {
  component: ScalarTextField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'string', defaultValue: 'Scalar Text Field' },
  },
  render: (args) => ({
    components: { ScalarTextField },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: `<ScalarTextField :modelValue="model" @update:modelValue="newValue => model = newValue" v-bind="args"/>`,
  }),
} satisfies Meta<typeof ScalarTextField>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {
    modelValue: '',
    label: 'Scalar Text Field',
    placeholder: 'This is a place where you can type out anything',
  },
}

export const Error: Story = {
  args: {
    modelValue: '',
    label: 'Scalar Text Field',
    placeholder: 'This is a place where you can type out anything',
    helperText: 'There was some sort of error with the field',
    error: true,
  },
}

export const MultiLine: Story = {
  args: {
    modelValue: '',
    placeholder: 'This is a place where you can type out anything',
    isMultiline: true,
    label: 'Scalar Text Field',
  },
}

export const NoLabel: Story = {
  args: {
    modelValue: '',
    placeholder: 'This is a place where you can type out anything',
  },
}
