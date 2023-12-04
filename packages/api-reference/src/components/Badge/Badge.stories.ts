import type { Meta, StoryObj } from '@storybook/vue3'

import { Badge } from '.'

const meta: Meta<typeof Badge> = {
  title: 'Example/Badge',
  component: Badge,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Badge>

export const Text: Story = {
  render: () => ({
    components: {
      Badge,
    },
    template: `
      <Badge>
        Deprecated
      </Badge>
    `,
  }),
}

export const TwoBadges: Story = {
  render: () => ({
    components: {
      Badge,
    },
    template: `
      <Badge>
        1.0.11
      </Badge>
      <Badge>
        OAS 3.0.2
      </Badge>
    `,
  }),
}
