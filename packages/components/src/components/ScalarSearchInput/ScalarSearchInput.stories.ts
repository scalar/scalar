import type { Meta, StoryObj } from '@storybook/vue3'

// import { useLoadingState } from '../ScalarLoading'
import ScalarSearchInput from './ScalarSearchInput.vue'

/**
 * - Default slot must be text only as it becomes the [aria]-label
 * - If you are looking for an icon only button, use ScalarIconButton instead, its a helpful wrapper around this component
 */
const meta = {
  component: ScalarSearchInput,
  tags: ['autodocs'],
  argTypes: {},
  render: (args) => ({
    components: { ScalarSearchInput },
    setup() {
      return { args }
    },
    template: `<div style="display: flex; flex-direction: column;">
      <ScalarSearchInput v-bind="args">Button</ScalarSearchInput>
    </div>`,
  }),
} satisfies Meta<typeof ScalarSearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
