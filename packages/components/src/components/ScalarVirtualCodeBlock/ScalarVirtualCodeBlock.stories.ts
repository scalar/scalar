import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarVirtualCodeBlock from './ScalarVirtualCodeBlock.vue'

const largeJson = JSON.stringify(
  Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`,
  })),
  null,
  2,
)

/**
 * Virtualized code block for large content with a copy button
 */
const meta = {
  component: ScalarVirtualCodeBlock,
  argTypes: {
    lang: { control: 'text' },
    copy: { control: 'select', options: ['always', 'hover', false] },
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarVirtualCodeBlock },
    setup() {
      return { args }
    },
    template: `
<div class="grid h-dvh w-dvw">
  <ScalarVirtualCodeBlock class="min-h-0 min-w-0" v-bind="args" />
</div>
    `,
  }),
} satisfies Meta<typeof ScalarVirtualCodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { content: largeJson, lang: 'json' } }

export const CopyAlways: Story = {
  args: { content: largeJson, lang: 'json', copy: 'always' },
}

export const NoCopy: Story = {
  args: { content: largeJson, lang: 'json', copy: false },
}
