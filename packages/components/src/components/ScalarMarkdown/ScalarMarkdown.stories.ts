import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarMarkdown from './ScalarMarkdown.vue'
import documentMd from './fixtures/document.md?raw'
import paragraphsMd from './fixtures/paragraphs.md?raw'
import headersMd from './fixtures/headers.md?raw'
import inlineMd from './fixtures/inline.md?raw'
import blockquotesMd from './fixtures/blockquotes.md?raw'
import listsMd from './fixtures/lists.md?raw'
import codeblocksMd from './fixtures/codeblocks.md?raw'

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

export const Base: Story = { args: { value: documentMd } }

export const Paragraphs: Story = { args: { value: paragraphsMd } }
export const Headers: Story = { args: { value: headersMd } }
export const Blockquotes: Story = { args: { value: blockquotesMd } }
export const Lists: Story = { args: { value: listsMd } }
export const Codeblocks: Story = { args: { value: codeblocksMd } }
export const Inline: Story = { args: { value: inlineMd } }
