import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../../'
import ScalarDropdown from './ScalarDropdown.vue'
import ScalarDropdownDivider from './ScalarDropdownDivider.vue'
import ScalarDropdownItem from './ScalarDropdownItem.vue'

const meta = {
  component: ScalarDropdown,
  tags: ['autodocs'],
  argTypes: {
    resize: {
      control: 'boolean',
    },
    placement: {
      control: 'select',
      options: placements,
    },
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: {
      ScalarDropdown,
      ScalarDropdownItem,
      ScalarDropdownDivider,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarDropdown v-bind="args">
    <ScalarButton>Click Me</ScalarButton>
    <template #items>
      <ScalarDropdownItem>An item</ScalarDropdownItem>
      <ScalarDropdownItem>Another item</ScalarDropdownItem>
      <ScalarDropdownDivider />
      <ScalarDropdownItem>An item with a long label that needs to be truncated</ScalarDropdownItem>
      <ScalarDropdownItem disabled>A disabled item</ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</div>
`,
  }),
} satisfies Meta<typeof ScalarDropdown>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const CustomClasses: Story = {
  args: { class: 'border border-red rounded' },
}
