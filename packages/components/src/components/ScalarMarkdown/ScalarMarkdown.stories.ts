import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarMarkdown from './ScalarMarkdown.vue'
import ScalarMarkdownSummary from './ScalarMarkdownSummary.vue'

import alertsMd from './fixtures/alerts.md?raw'
import blockquotesMd from './fixtures/blockquotes.md?raw'
import codeblocksMd from './fixtures/codeblocks.md?raw'
import documentMd from './fixtures/document.md?raw'
import headersMd from './fixtures/headers.md?raw'
import htmlMd from './fixtures/html.md?raw'
import inlineMd from './fixtures/inline.md?raw'
import listsMd from './fixtures/lists.md?raw'
import paragraphsMd from './fixtures/paragraphs.md?raw'
import tablesMd from './fixtures/tables.md?raw'

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarMarkdown,
  argTypes: {
    class: { control: 'text' },
    clamp: { control: 'number' },
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarMarkdown },
    setup() {
      return { args }
    },
    template: `
<div class="w-screen text-base p-4">
  <ScalarMarkdown v-bind="args" />
</div>
    `,
  }),
} satisfies Meta<typeof ScalarMarkdown>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { value: documentMd } }

export const Alerts: Story = { args: { value: alertsMd } }
export const Blockquotes: Story = { args: { value: blockquotesMd } }
export const Codeblocks: Story = { args: { value: codeblocksMd } }
export const Headers: Story = { args: { value: headersMd } }
export const Html: Story = { args: { value: htmlMd } }
export const Inline: Story = { args: { value: inlineMd } }
export const Lists: Story = { args: { value: listsMd } }
export const Paragraphs: Story = { args: { value: paragraphsMd } }
export const Tables: Story = { args: { value: tablesMd } }

export const Summary: Story = {
  args: {
    value: 'A paragraph is simply one or more consecutive lines of text, separated by one or more blank lines.',
  },
  render: (args) => ({
    components: { ScalarMarkdownSummary },
    setup() {
      return { args }
    },
    template: `
<div class="w-screen text-base p-4">
  <ScalarMarkdownSummary v-bind="args" />
</div>
  `,
  }),
}

export const SummaryWithRichText: Story = {
  args: {
    value: listsMd,
  },
  render: (args) => ({
    components: { ScalarMarkdownSummary },
    setup() {
      return { args }
    },
    template: `
<div class="w-screen text-base p-4">
  <ScalarMarkdownSummary v-bind="args" />
</div>
  `,
  }),
}
