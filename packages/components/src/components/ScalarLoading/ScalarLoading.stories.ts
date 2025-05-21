import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../ScalarButton'
import ScalarLoading, { useLoadingState } from './ScalarLoading.vue'

/**
 * To use the loading, you must pass in a loadingState which can be created using the useLoadingState hook exported from this component
 */
const meta = {
  component: ScalarLoading,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
    },
  },
  render: (args) => ({
    components: { ScalarButton, ScalarLoading },
    setup() {
      const loadingState = useLoadingState()
      loadingState.startLoading()
      return { args, loadingState }
    },
    template: `
      <div class="flex gap-16 items-center">
        <ScalarLoading :loadingState="loadingState" v-bind="args" />
        <div class="flex gap-4 items-center">
          <ScalarButton @click="loadingState.validate()">Validate</ScalarButton>
          <ScalarButton variant="danger" @click="loadingState.invalidate()">Invalidate</ScalarButton>
          <ScalarButton variant="outlined" @click="loadingState.clear() && loadingState.startLoading()">Clear</ScalarButton>
        </div>
      </div>
    `,
  }),
} satisfies Meta<typeof ScalarLoading>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { size: 'lg' } }

export const CustomClasses: Story = { args: { class: 'size-3 text-red' } }
