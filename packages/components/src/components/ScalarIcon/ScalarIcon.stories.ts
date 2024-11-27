import type { Meta, StoryObj } from '@storybook/vue3'

import IconList from './IconList.vue'
import ScalarIcon from './ScalarIcon.vue'
import { ICONS } from './icons'

const meta = {
  component: ScalarIcon,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: ICONS },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
    thickness: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    class: { control: 'text' },
    style: { control: 'text' },
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

export const CustomClasses: Story = {
  args: { icon: 'Logo', class: 'size-2' },
}

export const AllSizes: Story = {
  args: { icon: 'Checkmark' },
  render: (args) => ({
    components: { ScalarIcon },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center gap-2 text-c-2">
  <ScalarIcon size="xs" v-bind="args"/>
  <ScalarIcon size="sm" v-bind="args"/>
  <ScalarIcon size="md" v-bind="args"/>
  <ScalarIcon size="lg" v-bind="args"/>
  <ScalarIcon size="xl" v-bind="args"/>
  <ScalarIcon size="2xl" v-bind="args"/>
  <ScalarIcon size="3xl" v-bind="args"/>
</div>
    `,
  }),
}

export const AllIcons: StoryObj = {
  render: (args) => ({
    components: { IconList },
    setup() {
      return { args, icons: ICONS }
    },
    template: `<IconList :icons="icons" v-bind="args" />`,
  }),
}
