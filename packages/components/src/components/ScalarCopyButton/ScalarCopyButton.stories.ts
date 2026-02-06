import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarCopyButton from './ScalarCopyButton.vue'

const meta = {
  component: ScalarCopyButton,
  argTypes: {
    placement: {
      control: 'select',
      options: ['left', 'right'],
    },
    clear: { control: 'number' },
    copy: { control: 'text' },
    copied: { control: 'text' },
  },
  args: {
    placement: 'right',
    clear: 1500,
  },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarCopyButton },
    setup() {
      return { args }
    },
    template: `
<div class="flex" :class="{ 'justify-end': args.placement === 'left' }">
  <ScalarCopyButton v-bind="args">
    <template v-if="args.copy" #copy>{{ args.copy }}</template>
    <template v-if="args.copied" #copied>{{ args.copied }}</template>
  </ScalarCopyButton>
</div>`,
  }),
} satisfies Meta<typeof ScalarCopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
