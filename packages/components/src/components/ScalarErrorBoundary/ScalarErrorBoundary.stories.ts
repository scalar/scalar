import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../ScalarButton'
import ScalarErrorBoundary from './ScalarErrorBoundary.vue'

const meta: Meta = {
  component: ScalarErrorBoundary,
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarErrorBoundary, ScalarButton },
    setup() {
      const throwError = () => {
        throw new Error('This is a test error')
      }
      return { args, throwError }
    },
    template: `

  <ScalarErrorBoundary v-bind="args">
    <ScalarButton @click="throwError">Throw error</ScalarButton>
  </ScalarErrorBoundary>
`,
  }),
} satisfies Meta<typeof ScalarErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
