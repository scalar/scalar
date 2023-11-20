import type { Meta, StoryObj } from '@storybook/vue3'

import MarkdownRenderer from '../components/Content/MarkdownRenderer.vue'

const meta: Meta<typeof MarkdownRenderer> = {
  title: 'Example/MarkdownRenderer',
  component: MarkdownRenderer,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof MarkdownRenderer>

export const Default: Story = {
  render: (args) => ({
    components: {
      MarkdownRenderer,
    },
    setup() {
      return { args }
    },
    template: `
        <MarkdownRenderer v-bind="args">
          Example Content
        </MarkdownRenderer>
    `,
  }),
  args: {
    value: `# Example Content

This is an example paragraph. And this is a code block with syntax highlighting:

    const foo = 'bar'
`,
  },
}
