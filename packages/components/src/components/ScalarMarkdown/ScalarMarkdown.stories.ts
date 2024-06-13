import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarMarkdown from './ScalarMarkdown.vue'
import markdownContent from './test.md?raw'

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarMarkdown,
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarMarkdown },
    setup() {
      return { args }
    },
    template: `<ScalarMarkdown v-bind="args" />`,
  }),
} satisfies Meta<typeof ScalarMarkdown>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { value: markdownContent } }
