import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { ScalarButton, ScalarIcon } from '../..'
import ScalarCombobox from './ScalarCombobox.vue'
import ScalarComboboxMultiselect from './ScalarComboboxMultiselect.vue'
import type { Option } from './types'

const meta = {
  component: ScalarCombobox,
  tags: ['autodocs'],
  argTypes: {
    resize: {
      control: 'boolean',
    },
    placement: {
      control: 'select',
      options: placements,
    },
  },
} satisfies Meta<typeof ScalarCombobox>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { id: '1', label: 'Apple' },
  { id: '2', label: 'Banana' },
  { id: '3', label: 'Superduperlongnameberry' },
  { id: '4', label: 'Strawberry' },
  { id: '5', label: 'Raspberry' },
  { id: '7', label: 'Blackberry' },
]

export const Base: Story = {
  args: { options },
  render: (args) => ({
    components: {
      ScalarCombobox,
      ScalarButton,
      ScalarIcon,
    },
    setup() {
      const selected = ref<Option>()
      return { args, selected }
    },
    template: `
<div class="flex justify-center w-full h-72">
  <ScalarCombobox v-model="selected" placeholder="Change fruit..." v-bind="args">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected?.label ?? 'Select a fruit' }}
        </span>
      </div>
    </ScalarButton>
  </ScalarCombobox>
</div>
`,
  }),
}
export const Multiselect: Story = {
  args: { options },
  render: (args) => ({
    components: {
      ScalarComboboxMultiselect,
      ScalarButton,
      ScalarIcon,
    },
    setup() {
      const selected = ref<Option[]>([])
      return { args, selected }
    },
    template: `
<div class="flex justify-center w-full h-72">
  <ScalarComboboxMultiselect v-model="selected" placeholder="Select fruits..." v-bind="args">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected.length }} fruits selected
        </span>
      </div>
    </ScalarButton>
  </ScalarComboboxMultiselect>
</div>
`,
  }),
}
