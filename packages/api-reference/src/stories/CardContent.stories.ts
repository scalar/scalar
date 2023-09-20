import '@scalar/default-theme/theme.css'
import type { Meta, StoryObj } from '@storybook/vue3'

import { CardContent } from '../components/Card'

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
      <div class="light-mode">
        <CardContent v-bind="args">
          Example Content
        </CardContent>
      </div>
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
      <div class="light-mode">
        <CardContent v-bind="args">
          Example Content
        </CardContent>
      </div>
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
      <div class="light-mode">
        <CardContent v-bind="args">
          Example Content
        </CardContent>
      </div>
    `,
  }),
  args: {
    frameless: true,
  },
}
