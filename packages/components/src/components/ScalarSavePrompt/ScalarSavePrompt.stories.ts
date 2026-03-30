import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

import { ScalarButton } from '../ScalarButton'
import { ScalarSavePrompt } from './'

const meta = {
  component: ScalarSavePrompt,
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarButton, ScalarSavePrompt },
    setup() {
      const dirty = ref(false)
      return { args, dirty }
    },
    template: `
      <div class="flex flex-col gap-3 p-4">
        <ScalarButton @click="dirty = !dirty">Set dirty to {{ !dirty }}</ScalarButton>
        <ScalarSavePrompt
          v-bind="args"
          v-model="dirty"
          @save="dirty = false"
          @discard="dirty = false" />
      </div>
    `,
  }),
} satisfies Meta<typeof ScalarSavePrompt>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {} as any,
}

export const CustomCopy: Story = {
  args: {
    title: 'Leave editor?',
    message: 'Your draft will be lost unless you save.',
    saveLabel: 'Save draft',
    discardLabel: 'Leave anyway',
    cancelLabel: 'Keep editing',
  } as any,
}
