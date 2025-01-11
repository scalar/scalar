import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarSidebar from './ScalarSidebar.vue'

const meta: Meta<typeof ScalarSidebar> = {
  component: ScalarSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => ({
    components: { ScalarSidebar },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar>
    <div class="placeholder flex-1">Sidebar content</div>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
