import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarHeaderButton from './ScalarHeaderButton.vue'

/**
 * - Default slot must be text only as it becomes the [aria]-label
 * - If you are looking for an icon only button, use ScalarIconButton instead, its a helpful wrapper around this component
 */
const meta = {
  component: ScalarHeaderButton,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarHeaderButton },
    setup() {
      return { args }
    },
    template: `<ScalarHeaderButton v-bind="args">Button</ScalarHeaderButton>`,
  }),
} satisfies Meta<typeof ScalarHeaderButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const WithHref: Story = { args: { href: 'https://scalar.dev' } }
