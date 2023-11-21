import type { Meta, StoryObj } from '@storybook/vue3'

import { CardContent } from '.'

const meta: Meta<typeof CardContent> = {
  title: 'Example/CardContent',
  component: CardContent,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof CardContent>

export const Default: Story = {
  render: (args) => ({
    components: {
      CardContent,
    },
    setup() {
      return { args }
    },
    template: `
        <CardContent v-bind="args">
          Example Content
        </CardContent>
    `,
  }),
  args: {},
}

export const Muted: Story = {
  render: (args) => ({
    components: {
      CardContent,
    },
    setup() {
      return { args }
    },
    template: `
      <CardContent v-bind="args">
        Example Content
      </CardContent>
    `,
  }),
  args: {
    muted: true,
  },
}

export const Frameless: Story = {
  render: (args) => ({
    components: {
      CardContent,
    },
    setup() {
      return { args }
    },
    template: `
      <CardContent v-bind="args">
        Example Content
      </CardContent>
    `,
  }),
  args: {
    frameless: true,
  },
}
