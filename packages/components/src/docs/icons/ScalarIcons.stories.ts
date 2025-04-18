import type { Meta, StoryObj } from '@storybook/vue3'

import * as icons from '@scalar/icons'

const meta = {
  title: 'Playgrounds / Scalar Icons',
  args: {
    icon: 'ScalarIconMagnifyingGlass',
  },
  argTypes: {
    icon: {
      control: 'select',
      options: Object.keys(icons),
    },
    weight: {
      control: 'select',
      options: ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'],
    },
    class: { control: 'text' },
    style: { control: 'text' },
  },
  render: (args) => ({
    components: icons,
    setup() {
      return { args }
    },
    template: `<component :is="args.icon" size="lg" v-bind="args"/>`,
  }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {},
}
