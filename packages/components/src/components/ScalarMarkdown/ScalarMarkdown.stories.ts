import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarMarkdown from './ScalarMarkdown.vue'
import ScalarMarkdownSummary from './ScalarMarkdownSummary.vue'

import { samples } from './samples'

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarMarkdown,
  argTypes: {
    class: { control: 'text' },
    clamp: { control: 'number' },
    value: {
      control: { type: 'select' },
      options: samples.map((sample) => sample.label),
      mapping: Object.fromEntries(samples.map(({ label, value }) => [label, value])),
    },
  },
  args: { value: samples[0].value },
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
type SummaryStory = StoryObj<Meta<typeof ScalarMarkdownSummary>>

export const Base: Story = {}

export const Summary: SummaryStory = {
  args: {
    value: 'A paragraph is simply one or more **consecutive lines of text**, separated by one or more blank lines.',
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
