import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../ScalarButton'
import ScalarModal, { useModal } from './ScalarModal.vue'

/**
 * Make sure to import the useModal hook from the ScalarModal component to open/close it
 */
const meta = {
  component: ScalarModal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['history', 'search'] },
  },
} satisfies Meta<typeof ScalarModal>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {} as any,
  render: (args) => ({
    components: { ScalarButton, ScalarModal },
    setup() {
      const modalState = useModal()
      return { args, modalState }
    },
    template: `
      <ScalarModal
        :state="modalState"
        v-bind="args"
        title="Example modal">
        <div class="col gap-4 px-4">
          <div>You can put some nice content here, or even ask a nice question</div>
          <div class="col md:row gap-1">
            <ScalarButton variant="ghost" @click="modalState.hide()" fullWidth>Cancel</ScalarButton>
            <ScalarButton @click="modalState.hide()" fullWidth>Go ahead</ScalarButton>
          </div>
        </div>
      </ScalarModal>
      <ScalarButton @click="modalState.show()">Click me</ScalarButton>
    `,
  }),
}
