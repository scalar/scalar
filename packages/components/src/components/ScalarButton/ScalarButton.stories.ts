import { ScalarIconCube } from '@scalar/icons'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { useLoadingState } from '../ScalarLoading'
import ScalarButton from './ScalarButton.vue'
import type { ButtonSize, ButtonVariant } from './types'

const sizes = ['xs', 'sm', 'md'] as const satisfies ButtonSize[]
const variants = ['solid', 'outlined', 'ghost', 'gradient', 'danger'] as const satisfies ButtonVariant[]

const meta = {
  component: ScalarButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: { size: 'md', variant: 'solid', disabled: false, fullWidth: false },
  argTypes: {
    class: { control: 'text' },
    size: { control: 'select', options: sizes, mapping: Object.fromEntries(sizes.map((size) => [size, size])) },
    loading: { control: false },
    variant: {
      control: 'select',
      options: variants,
      mapping: Object.fromEntries(variants.map((variant) => [variant, variant])),
    },
  },
  render: (args) => ({
    components: { ScalarButton },
    setup() {
      return { args }
    },
    template: `
<div class="w-fit p-2">
  <ScalarButton v-bind="args">Button</ScalarButton>
</div>`,
  }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Disabled: Story = { args: { disabled: true } }

export const Loading: Story = {
  render: (args) => ({
    components: { ScalarButton },
    setup() {
      const loader = useLoadingState()
      const toggleLoading = () => {
        if (loader.isLoading) {
          loader.validate()
        } else {
          loader.start()
        }
      }
      return { args, loader, toggleLoading }
    },
    template: `
<div class="w-fit p-2">
  <ScalarButton v-bind="args" @click="toggleLoading()" :loader>Click me</ScalarButton>
</div>`,
  }),
}

export const WithIcon: Story = {
  args: { icon: ScalarIconCube as any },
}

export const AsLink: Story = {
  render: (args) => ({
    components: { ScalarButton },
    setup() {
      return { args }
    },
    template: `
<div class="w-fit p-2">
  <ScalarButton  is="a" href="#" v-bind="args">Button</ScalarButton>
</div>`,
  }),
}

export const CustomClasses: Story = {
  args: { class: 'font-normal px-9 py-1' },
}
