import { ScalarIconAcorn } from '@scalar/icons'
import type { Meta, StoryObj } from '@storybook/vue3'

import { useLoadingState } from '../ScalarLoading'
import ScalarButton from './ScalarButton.vue'

const sizes = ['sm', 'md'] as const
const variants = ['solid', 'outlined', 'ghost', 'danger'] as const

const meta = {
  component: ScalarButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    class: { control: 'text' },
    size: { control: 'select', options: sizes, mapping: Object.fromEntries(sizes.map((size) => [size, size])) },
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
} satisfies Meta<typeof ScalarButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Disabled: Story = { args: { disabled: true } }

export const Loading: Story = {
  render: (args) => ({
    components: { ScalarButton },
    setup() {
      const loadingState = useLoadingState()
      return { args, loadingState }
    },
    template: `
<div class="w-fit p-2">
  <ScalarButton v-bind="args" @click="loadingState.startLoading()" :loading="loadingState">Click me</ScalarButton>
</div>`,
  }),
}

export const WithIcon: Story = {
  render: (args) => ({
    components: { ScalarButton, ScalarIconAcorn },
    setup() {
      return { args }
    },
    template: `
<div class="w-fit p-2">
  <ScalarButton v-bind="args">
    <template #icon>
      <ScalarIconAcorn class="size-full" />
    </template>
    Button
  </ScalarButton>
</div>
    `,
  }),
}

export const CustomClasses: Story = {
  args: { class: 'items-start font-normal px-9 py-1' },
}
