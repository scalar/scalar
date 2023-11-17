import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarIcon from './ScalarIcon.vue'
import { iconNames } from './icons/iconNames'

const meta = {
  component: ScalarIcon,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: iconNames },
  },
  parameters: {
    docs: {
      description: {
        component:
          'This component will expand to fit its parent so make sure to constrain it, you can see how its done with tailwind here in the show code block.',
      },
    },
  },
  render: (args) => ({
    components: { ScalarIcon },
    setup() {
      return { args }
    },
    template: `<div class='h-10 w-10 text-fore-1'><ScalarIcon v-bind="args"/></div>`,
  }),
} satisfies Meta<typeof ScalarIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { name: 'Logo' },
}
