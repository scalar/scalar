import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarIcon from './ScalarIcon.vue'
import { ICONS } from './icons/icons'

const meta = {
  component: ScalarIcon,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: ICONS },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
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
    template: `<ScalarIcon size="lg" v-bind="args"/>`,
  }),
} satisfies Meta<typeof ScalarIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { icon: 'Logo' },
}
