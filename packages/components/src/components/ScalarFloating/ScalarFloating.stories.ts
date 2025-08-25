import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarFloating from './ScalarFloating.vue'
import ScalarFloatingBackdrop from './ScalarFloatingBackdrop.vue'
import { placements } from '@floating-ui/utils'

const meta: Meta = {
  component: ScalarFloating,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: placements,
      mapping: Object.fromEntries(placements.map((p) => [p, p])),
    },
    offset: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  render: (args) => ({
    components: { ScalarFloating, ScalarFloatingBackdrop },
    setup() {
      console.log(JSON.stringify(args))
      return { args }
    },
    template: `
<div 
  class="flex w-screen h-screen items-center justify-center p-2.5"
  :class="{
    '!items-start': args?.placement?.startsWith('bottom'),
    '!items-end': args?.placement?.startsWith('top'),
    '!justify-start': args?.placement?.startsWith('right'),
    '!justify-end': args?.placement?.startsWith('left')
  }"
>
  <ScalarFloating v-bind="args">
    <div class="rounded border bg-b-2 p-2">Target for #floating</div>
    <template #floating="{ width, height }">
      <div class="grid relative max-w-[inherit] max-h-[inherit] size-60" :style="{ width, height }">
        <div class="placeholder">Floating</div>
        <ScalarFloatingBackdrop />
      </div>
    </template>
  </ScalarFloating>
</div>
`,
  }),
} satisfies Meta<typeof ScalarFloating>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Resized: Story = {
  args: {
    placement: 'bottom-start',
    resize: true,
  },
}
