import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { ScalarButton, ScalarDropdownButton, ScalarIcon } from '../..'
import ScalarCombobox from './ScalarCombobox.vue'
import ScalarComboboxMultiselect from './ScalarComboboxMultiselect.vue'
import type { Option, OptionGroup } from './types'

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
    class: { control: 'text' },
  },
} satisfies Meta<typeof ScalarCombobox>

export default meta
type Story = StoryObj<typeof meta>

const options: Option[] = [
  { id: '1', label: 'Apple' },
  { id: '2', label: 'Banana' },
  { id: '3', label: 'Superduperlongnameberry' },
  { id: '4', label: 'Strawberry' },
  { id: '5', label: 'Raspberry' },
  { id: '7', label: 'Blackberry' },
]

const groups: OptionGroup[] = [
  {
    label: 'Canada',
    options: [
      { id: 'ca-yvr', label: 'Vancouver' },
      { id: 'ca-yyc', label: 'Calgary' },
      { id: 'ca-yyz', label: 'Toronto' },
    ],
  },
  {
    label: 'United States',
    options: [
      { id: 'us-sea', label: 'Seattle' },
      { id: 'us-lax', label: 'Los Angeles' },
      { id: 'us-jfk', label: 'New York' },
    ],
  },
  {
    label: 'Japan',
    options: [
      { id: 'jp-hnd', label: 'Tokyo' },
      { id: 'jp-itm', label: 'Osaka' },
    ],
  },
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
<div class="flex justify-center w-full min-h-96">
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

export const Groups: Story = {
  args: { options: groups },
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
<div class="flex justify-center w-full min-h-96">
  <ScalarCombobox v-model="selected" placeholder="Change city..." v-bind="args">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected?.label ?? 'Select a city' }}
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
<div class="flex justify-center w-full min-h-96">
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

export const MultiselectGroups: Story = {
  args: { options: groups },
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
<div class="flex justify-center w-full min-h-96">
  <ScalarComboboxMultiselect v-model="selected" placeholder="Select cities..." v-bind="args">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected.length }} cities selected
        </span>
      </div>
    </ScalarButton>
  </ScalarComboboxMultiselect>
</div>
`,
  }),
}

export const WithSlots: Story = {
  args: { options: groups },
  render: (args) => ({
    components: {
      ScalarComboboxMultiselect,
      ScalarButton,
      ScalarIcon,
      ScalarDropdownButton,
    },
    setup() {
      const selected = ref<Option[]>([])
      return { args, selected }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarComboboxMultiselect v-model="selected" placeholder="Select cities..." v-bind="args">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected.length }} cities selected
        </span>
      </div>
    </ScalarButton>
    <template #before>
      <div class="placeholder">Before</div>
    </template>
    <template #after>
      <div class="placeholder">After</div>
    </template>
  </ScalarComboboxMultiselect>
</div>
`,
  }),
}

/**
 * Applies a custom class to the combobox popover
 */
export const CustomClasses: Story = {
  args: {
    options,
    class: 'border-red',
  },
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
<div class="flex justify-center w-full min-h-96">
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
