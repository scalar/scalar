import type { Meta, StoryObj } from '@storybook/vue3'

import { ICONS } from '../ScalarIcon/icons'
import ScalarIconButton from './ScalarIconButton.vue'

/**
 * A helper wrapper around the icon only ScalarButton
 */
const meta = {
  component: ScalarIconButton,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: ICONS },
    size: { control: 'select', options: ['xxs', 'xs', 'sm', 'md'] },
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['solid', 'outlined', 'ghost', 'danger'],
    },
    disabled: { control: 'boolean' },
    class: { control: 'text' },
  },
} satisfies Meta<typeof ScalarIconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { icon: 'Logo', label: 'Logo button' },
}

export const Disabled: Story = {
  args: { icon: 'Logo', label: 'Logo button', disabled: true },
}

export const CustomClasses: Story = {
  args: { icon: 'Logo', label: 'Logo button', class: 'size-3 p-0' },
}
