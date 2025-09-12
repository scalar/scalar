import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarCheckboxInput from './ScalarCheckboxInput.vue'
import type { ScalarCheckboxOption } from './types'
import ScalarCheckboxGroup from './ScalarCheckboxGroup.vue'
import ScalarCheckboxRadioGroup from './ScalarCheckboxRadioGroup.vue'

const meta: Meta = {
  component: ScalarCheckboxInput,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    type: { control: 'select', options: ['checkbox', 'radio'] },
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

const options: ScalarCheckboxOption[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Superduperlongnameberry' },
  { value: '4', label: 'Strawberry' },
  { value: '5', label: 'Raspberry' },
  { value: '7', label: 'Blackberry' },
]

export const Checkboxes: Story = {
  args: { options },
  render: (args) => ({
    components: { ScalarCheckboxGroup },
    setup() {
      const model = ref<ScalarCheckboxOption[]>([])
      return { args, model }
    },
    template: `
      <ScalarCheckboxGroup v-model="model" v-bind="args" />
    `,
  }),
}

export const Radios: Story = {
  args: { options },
  render: (args) => ({
    components: { ScalarCheckboxRadioGroup },
    setup() {
      const model = ref<ScalarCheckboxOption>()
      return { args, model }
    },
    template: `
      <ScalarCheckboxRadioGroup v-model="model" v-bind="args" />
    `,
  }),
}
