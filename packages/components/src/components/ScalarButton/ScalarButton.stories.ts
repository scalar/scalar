import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarIcon } from '../ScalarIcon'
import { useLoadingState } from '../ScalarLoading'
import ScalarButton from './ScalarButton.vue'

/**
 * - Default slot must be text only as it becomes the [aria]-label
 * - If you are looking for an icon only button, use ScalarIconButton instead, its a helpful wrapper around this component
 */
const meta = {
  component: ScalarButton,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['md'] },
    variant: {
      control: 'select',
      options: ['solid', 'outlined', 'ghost', 'danger'],
    },
  },
  render: (args) => ({
    components: { ScalarButton },
    setup() {
      return { args }
    },
    template: `<ScalarButton v-bind="args">Button</ScalarButton>`,
  }),
} satisfies Meta<typeof ScalarButton>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const FullWidth: Story = { args: { fullWidth: true } }

export const Disabled: Story = { args: { disabled: true } }

export const Loading: Story = {
  render: () => ({
    components: { ScalarButton },
    setup() {
      const loadingState = useLoadingState()
      return { loadingState }
    },
    template: `<ScalarButton @click="loadingState.startLoading()" :loading="loadingState">Click me</ScalarButton>`,
  }),
}

export const LoadingFullWidth: Story = {
  render: () => ({
    components: { ScalarButton },
    setup() {
      const loadingState = useLoadingState()
      return { loadingState }
    },
    template: `<ScalarButton @click="loadingState.startLoading()" :loading="loadingState" fullWidth>Click me</ScalarButton>`,
  }),
}

export const WithIcon: Story = {
  render: (args) => ({
    components: { ScalarButton, ScalarIcon },
    setup() {
      return { args }
    },
    template: `
      <ScalarButton :variant="args.variant">
        <template #icon>
          <ScalarIcon icon="Logo"/>
        </template>
        Button
      </ScalarButton>
    `,
  }),
}

export const CustomClasses: Story = {
  render: () => ({
    components: { ScalarButton },
    template: `<ScalarButton class="items-start font-normal px-9 py-1">I am a weird button</ScalarButton>`,
  }),
}
