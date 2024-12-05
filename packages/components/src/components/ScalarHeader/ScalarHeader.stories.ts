import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarHeader from './ScalarHeader.vue'

const placeholder = (s: string) =>
  `<div class="flex items-center justify-center border border-c-1 border-dashed rounded w-full h-8">${s}</div>`

/**
 * - Default slot must be text only as it becomes the [aria]-label
 * - If you are looking for an icon only button, use ScalarIconButton instead, its a helpful wrapper around this component
 */
const meta = {
  component: ScalarHeader,
  tags: ['autodocs'],
  argTypes: {},
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    components: { ScalarHeader },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <template #start>${placeholder('Start')}</template>
  ${placeholder('Center')}
  <template #end>${placeholder('End')}</template>
</ScalarHeader>`,
  }),
} satisfies Meta<typeof ScalarHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
