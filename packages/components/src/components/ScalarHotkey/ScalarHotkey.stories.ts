import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarHotkey from './ScalarHotkey.vue'

const meta = {
  component: ScalarHotkey,
  tags: ['autodocs'],
  args: {
    hotkey: 'K',
    modifier: ['Meta'],
  },
  argTypes: {
    hotkey: { control: 'text' },
    modifier: { control: 'object' },
    class: { control: 'text' },
  },
  render: (args) => ({
    components: {
      ScalarHotkey,
    },
    setup() {
      return { args }
    },
    template: ` <ScalarHotkey v-bind="args" /> `,
  }),
} satisfies Meta<typeof ScalarHotkey>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const MultipleModifiers: Story = {
  args: {
    hotkey: 'K',
    modifier: ['Meta', 'Shift'],
  },
}
