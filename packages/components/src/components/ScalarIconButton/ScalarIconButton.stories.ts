import type { Meta, StoryObj } from '@storybook/vue3'

import { ICONS } from '../ScalarIcon/icons'
import ScalarIconButton from './ScalarIconButton.vue'
import { placements } from '@floating-ui/utils'

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
    tooltip: { control: 'select', options: placements },
    class: { control: 'text' },
  },
} satisfies Meta<typeof ScalarIconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { icon: 'Logo', label: 'Scalar' },
}

export const Disabled: Story = {
  args: { icon: 'Logo', label: 'Scalar', disabled: true },
}

export const WithTooltip: Story = {
  args: { icon: 'Logo', label: 'Scalar', tooltip: true },
}

export const CustomClasses: Story = {
  args: { icon: 'Logo', label: 'Scalar', class: 'size-3 p-0' },
}
