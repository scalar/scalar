import type { Meta, StoryObj } from '@storybook/vue3-vite'

import SpecificationExtensions from './SpecificationExtensions.vue'

const meta: Meta<typeof SpecificationExtensions> = {
  title: 'Schema/SpecificationExtensions',
  component: SpecificationExtensions,
}

export default meta

export const Compact: StoryObj<typeof SpecificationExtensions> = {
  render: () => ({
    components: { SpecificationExtensions },
    setup: () => ({ extensions: { 'x-owner': 'checkout', 'x-cost': { requests: 1 } } }),
    template: `
      <section aria-label="Plain extensions">
        <SpecificationExtensions :extensions="extensions" compact />
      </section>
      <section aria-label="Folded extensions">
        <SpecificationExtensions :extensions="extensions" compact collapsible />
      </section>
    `,
  }),
}
