import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { ScalarButton } from '../..'
import ScalarListbox from './ScalarListbox.vue'
import type { Option } from './types'
import { ScalarIconCaretDown } from '@scalar/icons'

const meta = {
  component: ScalarListbox,
  tags: ['autodocs'],
  argTypes: {
    resize: { control: 'boolean' },
    placement: { control: 'select', options: placements },
    class: { control: 'text' },
  },
} satisfies Meta<typeof ScalarListbox>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {
    options: [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
      { id: '3', label: 'Option 3 with a label that needs to be truncated' },
      { id: '4', label: 'Option 4 (Disabled)', disabled: true },
    ],
  },
  render: (args) => ({
    components: {
      ScalarListbox,
      ScalarButton,
      ScalarIconCaretDown,
    },
    setup() {
      const selected = ref<Option>()
      return { args, selected }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarListbox v-model="selected" v-bind="args">
    <ScalarButton class="w-48 px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected?.label ?? 'Select an option' }}
        </span>
        <ScalarIconCaretDown class="ml-1 ui-open:rotate-180 size-3" weight="bold" />
      </div>
    </ScalarButton>
  </ScalarListbox>
</div>
`,
  }),
}

export const Multiselect: Story = {
  args: {
    multiple: true,
    options: [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
      { id: '3', label: 'Option 3' },
    ],
  },
  render: (args) => ({
    components: {
      ScalarListbox,
      ScalarButton,
      ScalarIconCaretDown,
    },
    setup() {
      const selected = ref<Option[]>([])
      return { args, selected }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarListbox v-model="selected" v-bind="args">
    <ScalarButton class="w-48 min-w-max px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected?.length ? selected.map(o => o.label).join(', ') : 'Select an option' }}
        </span>
        <ScalarIconCaretDown class="ml-1 ui-open:rotate-180 size-3" weight="bold" />
      </div>
    </ScalarButton>
  </ScalarListbox>
</div>
`,
  }),
}

export const CustomClasses: Story = {
  args: {
    class: 'border border-red rounded',
    options: [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
      { id: '3', label: 'Option 3' },
    ],
  },
  render: (args) => ({
    components: {
      ScalarListbox,
      ScalarButton,
      ScalarIconCaretDown,
    },
    setup() {
      const selected = ref<Option>()
      return { args, selected }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarListbox v-model="selected" v-bind="args">
    <ScalarButton class="w-48 min-w-max px-3" variant="outlined">
      <div class="flex flex-1 items-center min-w-0">
        <span class="inline-block truncate flex-1 min-w-0 text-left">
        {{ selected?.label ?? 'Select an option' }}
        </span>
        <ScalarIconCaretDown class="ml-1 ui-open:rotate-180 size-3" weight="bold" />
      </div>
    </ScalarButton>
  </ScalarListbox>
</div>
`,
  }),
}
