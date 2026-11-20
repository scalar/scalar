import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

import { ScalarButton } from '../ScalarButton'
import ScalarDialog from './ScalarDialog.vue'

/**
 * Control the dialog with `v-model:open` (a plain `ref`) and compose its contents
 * with the default slot. There are no size or variant props — restyle or resize by
 * passing your own `class`.
 */
const meta = {
  component: ScalarDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ScalarDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  render: (args) => ({
    components: { ScalarButton, ScalarDialog },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
      <div class="flex h-dvh items-center justify-center">
        <ScalarButton @click="open = true">Open dialog</ScalarButton>
      </div>
      <ScalarDialog
        v-model:open="open"
        aria-label="Example dialog"
        v-bind="args">
        <div class="flex flex-col gap-4">
          <h2 class="text-sm font-medium">Example dialog</h2>
          <p class="text-c-2">
            Compose whatever you want in here — there are no size or variant props,
            just the slot and class overrides.
          </p>
          <div class="flex gap-2 *:flex-1">
            <ScalarButton variant="outlined" @click="open = false">Cancel</ScalarButton>
            <ScalarButton @click="open = false">Confirm</ScalarButton>
          </div>
        </div>
      </ScalarDialog>
    `,
  }),
}

/**
 * Opening a dialog from within another stacks them in the top layer: the browser
 * inerts the dialog underneath, Escape closes the topmost first, and focus returns
 * down the stack — all without any bookkeeping on our side.
 */
export const Nested: Story = {
  render: () => ({
    components: { ScalarButton, ScalarDialog },
    setup() {
      const open = ref(false)
      const nested = ref(false)
      return { open, nested }
    },
    template: `
      <div class="flex h-dvh items-center justify-center">
        <ScalarButton @click="open = true">Open dialog</ScalarButton>
      </div>
      <ScalarDialog
        v-model:open="open"
        aria-label="First dialog">
        <div class="flex flex-col gap-4">
          <h2 class="text-sm font-medium">First dialog</h2>
          <p class="text-c-2">Open another dialog on top — the browser stacks and inerts this one.</p>
          <div class="flex gap-2 *:flex-1">
            <ScalarButton variant="outlined" @click="open = false">Close</ScalarButton>
            <ScalarButton @click="nested = true">Open nested</ScalarButton>
          </div>
        </div>
      </ScalarDialog>
      <ScalarDialog
        v-model:open="nested"
        aria-label="Nested dialog"
        class="max-w-sm">
        <div class="flex flex-col gap-4">
          <h2 class="text-sm font-medium">Nested dialog</h2>
          <p class="text-c-2">Escape closes me first, then the dialog underneath.</p>
          <ScalarButton @click="nested = false">Close</ScalarButton>
        </div>
      </ScalarDialog>
    `,
  }),
}

/** The dialog caps its height and scrolls long content rather than the page. */
export const Scrolling: Story = {
  render: () => ({
    components: { ScalarButton, ScalarDialog },
    setup() {
      const open = ref(false)
      const paragraphs = Array.from({ length: 12 }, (_, i) => i + 1)
      return { open, paragraphs }
    },
    template: `
      <div class="flex h-dvh items-center justify-center">
        <ScalarButton @click="open = true">Open dialog</ScalarButton>
      </div>
      <ScalarDialog
        v-model:open="open"
        aria-label="Scrolling dialog">
        <div class="flex flex-col gap-3">
          <h2 class="text-sm font-medium">Lots of content</h2>
          <p
            v-for="n in paragraphs"
            :key="n"
            class="text-c-2">
            Paragraph {{ n }} — the dialog caps its height and scrolls the overflow.
          </p>
        </div>
      </ScalarDialog>
    `,
  }),
}
