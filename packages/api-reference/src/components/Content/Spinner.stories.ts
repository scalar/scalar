import type { Meta, StoryObj } from '@storybook/vue3'

import Spinner from './Spinner.vue'

const meta: Meta<typeof Spinner> = {
  title: 'Example/Spinner',
  component: Spinner,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  render: (args) => ({
    components: {
      Spinner,
    },
    setup() {
      return { args }
    },
    template: `
        <Spinner v-bind="args" />
    `,
  }),
  args: {},
}
