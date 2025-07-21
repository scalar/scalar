import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarCodeBlockCopy from './ScalarCodeBlockCopy.vue'

const contentCurl = `curl --request PUT \\
  --url https://galaxy.scalar.com/planets \\
  --header 'Authorization: Bearer secret-token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "name": "Earth",
    "type": "terrestrial"
  }'`

/**
 * A standalone copy button component for copying content to clipboard
 */
const meta = {
  component: ScalarCodeBlockCopy,
  argTypes: {
    content: { control: 'text' },
    id: { control: 'text' },
    class: { control: 'text' },
  },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarCodeBlockCopy },
    setup() {
      return { args }
    },
    template: `
      <div class="bg-b-2 flex">
        <ScalarCodeBlockCopy v-bind="args" class="opacity-100 left-10" />
      </div>
      `,
  }),
} satisfies Meta<typeof ScalarCodeBlockCopy>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {
    content: contentCurl,
    id: 'code-block-example',
  },
}

export const CustomStyling: Story = {
  args: {
    content: 'console.log("Hello, World!")',
    id: 'styled-block-example',
    class: 'bg-b-3',
  },
}
