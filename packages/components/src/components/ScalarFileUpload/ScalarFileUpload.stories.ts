import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarFileUpload from './ScalarFileUpload.vue'

const meta = {
  component: ScalarFileUpload,
  tags: ['autodocs'],
  argTypes: {
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: {
      ScalarFileUpload,
    },
    setup() {
      return { args }
    },
    template: `
  <ScalarFileUpload v-bind="args">
  </ScalarFileUpload>
`,
  }),
} satisfies Meta<typeof ScalarFileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
