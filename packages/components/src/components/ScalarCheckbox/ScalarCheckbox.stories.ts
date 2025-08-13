import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarCheckbox from './ScalarCheckbox.vue'

/**
 * - Default slot must be text only as it becomes the [aria]-label
 * - If you are looking for an icon only button, use ScalarIconButton instead, its a helpful wrapper around this component
 */
const meta = {
  component: ScalarCheckbox,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'boolean', default: false },
    size: { control: 'select', options: ['sm', 'md'] },
    label: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarCheckbox },
    setup() {
      return { args }
    },
    template: `<ScalarCheckbox v-bind="args" />`,
  }),
} satisfies Meta<typeof ScalarCheckbox>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
export const WithLabel: Story = {
  args: { label: 'Label' },
}
