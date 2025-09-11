import { placements } from '@floating-ui/utils'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarListbox from './ScalarListbox.vue'
import ScalarListboxInput from './ScalarListboxInput.vue'
import type { Option } from './types'

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
      ScalarListboxInput,
      ScalarIconCaretDown,
    },
    setup() {
      const selected = ref<Option>()
      return { args, selected }
    },
    template: `
<div class="flex items-start justify-center w-full min-h-96">
  <ScalarListbox v-model="selected" v-bind="args" v-slot="{ open }">
    <ScalarListboxInput class="w-48" :open>
        {{ selected?.label ?? 'Select an option' }}
    </ScalarListboxInput>
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
      ScalarListboxInput,
      ScalarIconCaretDown,
    },
    setup() {
      const selected = ref<Option[]>([])
      return { args, selected }
    },
    template: `
<div class="flex items-start justify-center w-full min-h-96">
  <ScalarListbox v-model="selected" v-bind="args" v-slot="{ open }">
       <ScalarListboxInput class="w-48" :open>
        {{ selected?.length ? selected.map(o => o.label).join(', ') : 'Select an option' }}
    </ScalarListboxInput>
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
      ScalarListboxInput,
      ScalarIconCaretDown,
    },
    setup() {
      const selected = ref<Option>()
      return { args, selected }
    },
    template: `
<div class="flex items-start justify-center w-full min-h-96">
  <ScalarListbox v-model="selected" v-bind="args" v-slot="{ open }">
    <ScalarListboxInput class="w-48" :open>
      {{ selected?.label ?? 'Select an option' }}
    </ScalarListboxInput>
  </ScalarListbox>
</div>
`,
  }),
}
