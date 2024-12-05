import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarTeleport from './ScalarTeleport.vue'
import ScalarTeleportRoot from './ScalarTeleportRoot.vue'

const meta: Meta<typeof ScalarTeleport> = {
  component: ScalarTeleport,
  tags: ['autodocs'],
  argTypes: {
    to: { control: false },
    disabled: { control: 'boolean' },
    immediate: { control: 'boolean' },
  },
  render: (args) => ({
    components: { ScalarTeleport, ScalarTeleportRoot },

    setup() {
      return { args }
    },
    template: `
<div class="relative w-min rounded border">
  <ScalarTeleportRoot>
    <div class="flex justify-center p-4 w-48 h-32 bg-b-2 rounded overflow-hidden relative">
      <span>Container</span>
      <div class="absolute top-12 left-4 z-1">
        <div class="rounded border bg-b-1 p-1 text-nowrap w-64">Not using &lt;ScalarTeleport&gt;</div>
      </div>
      <ScalarTeleport v-bind="args">
        <div class="absolute top-22 left-4 z-1">
          <div class="rounded border bg-b-1 p-1 text-nowrap w-56">Using &lt;ScalarTeleport&gt;</div>
        </div>
      </ScalarTeleport>
    </div>
  </ScalarTeleportRoot>
</div>
`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
