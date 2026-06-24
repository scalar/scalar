import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarScreenReader from './ScalarScreenReader.vue'

/**
 * Visually hides its content while keeping it available to screen readers. Use
 * it to add context for assistive technology without affecting the layout.
 *
 * It renders nothing visible, so it has no visual snapshot.
 */
const meta = {
  component: ScalarScreenReader,
  tags: ['autodocs'],
  render: () => ({
    components: { ScalarScreenReader },
    template: '<p>Add to cart <ScalarScreenReader>(2 items)</ScalarScreenReader></p>',
  }),
} satisfies Meta<typeof ScalarScreenReader>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
