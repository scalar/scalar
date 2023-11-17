import type { Meta, StoryObj } from '@storybook/vue3'

import { iconNames } from '../ScalarIcon/icons/iconNames'
import ScalarIconButton from './ScalarIconButton.vue'

const meta = {
  component: ScalarIconButton,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: iconNames },
    label: { control: 'string' },
    variant: {
      control: 'select',
      options: ['solid', 'outlined', 'ghost', 'danger'],
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A helper wrapper around the icon only ScalarButton',
      },
    },
  },
} satisfies Meta<typeof ScalarIconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { icon: 'Logo', label: 'Logo button' },
}
