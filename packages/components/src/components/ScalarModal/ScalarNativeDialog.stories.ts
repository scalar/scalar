import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

import { ScalarButton } from '../ScalarButton'
import ScalarNativeDialog from './ScalarNativeDialog.vue'

const meta = {
  component: ScalarNativeDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: false, unmount: false },
  argTypes: { open: { control: false } },
} satisfies Meta<typeof ScalarNativeDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Native modal behavior with a persistent editor and an accessible dismissal control. */
export const PersistentEditor: Story = {
  render: (args) => ({
    components: { ScalarButton, ScalarNativeDialog },
    setup() {
      return { args, open: ref(false) }
    },
    template: `
      <div class="scalar-app p-4">
        <ScalarButton @click="open = true">Open native dialog</ScalarButton>
        <ScalarNativeDialog v-bind="args" :open="open" aria-label="Native dialog example" @close="open = false">
          <div class="fixed inset-0 grid place-items-center bg-black/40 p-4">
            <div class="bg-b-1 text-c-1 flex w-full max-w-md flex-col gap-4 rounded-lg p-4 shadow-lg">
              <h2 class="font-bold">Persistent editor</h2>
              <label class="flex flex-col gap-2">
                Draft text
                <input class="rounded border p-2" placeholder="This text survives closing the dialog" />
              </label>
              <ScalarButton @click="open = false">Close dialog</ScalarButton>
            </div>
          </div>
        </ScalarNativeDialog>
      </div>
    `,
  }),
}
