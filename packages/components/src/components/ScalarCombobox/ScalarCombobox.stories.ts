import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

import { ScalarButton, ScalarDropdownButton, ScalarListboxCheckbox } from '../..'
import ScalarCombobox from './ScalarCombobox.vue'
import ScalarComboboxMultiselect from './ScalarComboboxMultiselect.vue'
import type { Option, OptionGroup } from './types'

/**
 * Helper to handle generic Vue components
 * @see https://github.com/storybookjs/storybook/issues/24238#issuecomment-2609580391
 */
type GenericMeta<C> = Omit<Meta<C>, 'component'> & {
  component: ComponentExposed<C>
}

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
} satisfies GenericMeta<typeof ScalarCombobox>

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

/** An example of an extended option with a timezone */
type ExtendedOption = Option & {
  timezone: string
}

/** An example of an extended option group with a flag */
type ExtendedOptionGroup = OptionGroup<ExtendedOption> & {
  flag: string
}

const groups: ExtendedOptionGroup[] = [
  {
    label: 'Canada',
    flag: '🇨🇦',
    options: [
      { id: 'ca-yvr', label: 'Vancouver', timezone: '-8' },
      { id: 'ca-yyc', label: 'Calgary', timezone: '-7' },
      { id: 'ca-yyz', label: 'Toronto', timezone: '-5' },
    ],
  },
  {
    label: 'United States',
    flag: '🇺🇸',
    options: [
      { id: 'us-sea', label: 'Seattle', timezone: '-8' },
      { id: 'us-lax', label: 'Los Angeles', timezone: '-8' },
      { id: 'us-jfk', label: 'New York', timezone: '-5' },
    ],
  },
  {
    label: 'Japan',
    flag: '🇯🇵',
    options: [
      { id: 'jp-hnd', label: 'Tokyo', timezone: '+9' },
      { id: 'jp-itm', label: 'Osaka', timezone: '+9' },
    ],
  },
]

export const Base: Story = {
  args: { options },
  render: (args) => ({
    components: {
      ScalarCombobox: ScalarCombobox as ComponentExposed<typeof ScalarCombobox>,
      ScalarButton,
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
      ScalarCombobox: ScalarCombobox as ComponentExposed<typeof ScalarCombobox>,
      ScalarButton,
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
      ScalarComboboxMultiselect: ScalarComboboxMultiselect as any,
      ScalarButton,
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
      ScalarComboboxMultiselect: ScalarComboboxMultiselect as any,
      ScalarButton,
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

export const WithAddNew: Story = {
  args: { options: [] },
  render: (args) => ({
    components: {
      ScalarComboboxMultiselect: ScalarComboboxMultiselect as any,
      ScalarButton,
      ScalarDropdownButton,
      ScalarListboxCheckbox,
    },
    setup() {
      const selected = ref<Option[]>([])
      const opts = ref<Option[]>([])
      const counter = ref<number>(1)
      function add() {
        const newOpt = { label: `Option ${counter.value}`, id: `${counter.value++}` }
        opts.value = [...opts.value, newOpt]
        selected.value = [...selected.value, newOpt]
      }
      add(), add(), add()

      return { args, selected, add, opts }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarComboboxMultiselect v-model="selected" v-bind="args" :options="opts" @add="add">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
          {{ selected.length }} of {{ opts.length }} options selected
        </span>
      </div>
    </ScalarButton>
    <template #add>
      Add a new option
    </template>
  </ScalarCombobox>
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
      ScalarCombobox: ScalarCombobox as ComponentExposed<typeof ScalarCombobox>,
      ScalarButton,
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
