import type { Meta, StoryObj } from '@storybook/vue3'

import * as icons from '@scalar/icons'

const meta = {
  title: 'Playgrounds / Scalar Icons',
  tags: ['!dev'],
  args: {
    icon: Object.keys(icons)[0],
  },
  argTypes: {
    icon: {
      control: 'select',
      options: Object.keys(icons),
      description: 'The icon to display',
      table: {
        subcategory: 'Options',
        type: { summary: 'string' },
        defaultValue: { summary: 'N/A' },
      },
    },
    weight: {
      control: 'select',
      options: ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'],
      description: 'The weight of the icon',
      table: {
        subcategory: 'Attributes',
        type: { summary: 'string' },
        defaultValue: { summary: 'regular' },
      },
    },
    class: {
      control: 'text',
      description: 'Classes to apply to the icon',
      table: {
        subcategory: 'Attributes',
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
  },
  render: (args) => ({
    components: icons,
    setup() {
      return { args }
    },
    template: `<component :is="args.icon" v-bind="args"/>`,
  }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {},
}
