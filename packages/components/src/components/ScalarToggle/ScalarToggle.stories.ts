import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import type { ScalarCheckboxOption } from '../ScalarCheckboxInput'
import ScalarToggle from './ScalarToggle.vue'
import ScalarToggleGroup from './ScalarToggleGroup.vue'
import ScalarToggleInput from './ScalarToggleInput.vue'

const meta = {
  component: ScalarToggle,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: (args) => ({
    components: { ScalarToggle },
    setup() {
      const model = ref(false)
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

export const Input: Story = {
  render: (args) => ({
    components: { ScalarToggleInput },
    setup() {
      const model = ref(false)
      return { args, model }
    },
    template: `<ScalarToggleInput v-bind="args" v-model="model">Click me</ScalarToggleInput>`,
  }),
}

const options: ScalarCheckboxOption[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Superduperlongnameberry' },
  { value: '4', label: 'Strawberry' },
  { value: '5', label: 'Raspberry' },
  { value: '7', label: 'Blackberry' },
]

export const Grouped: Story = {
  render: (args) => ({
    components: { ScalarToggleGroup },
    setup() {
      const model = ref([])
      return { args, options, model }
    },
    template: `<ScalarToggleGroup v-bind="args" :options v-model="model" />`,
  }),
}
