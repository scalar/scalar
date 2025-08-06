import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarMarkdown from './ScalarMarkdown.vue'
import markdownContent from './fixtures/document.md?raw'

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarMarkdown,
  argTypes: {
    class: { control: 'text' },
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarMarkdown },
    setup() {
      return { args }
    },
    template: `
<div class="w-screen text-base bg-b-1 p-4">
  <ScalarMarkdown v-bind="args" />
</div>
    `,
  }),
} satisfies Meta<typeof ScalarMarkdown>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {
    value: markdownContent,
  },
}
