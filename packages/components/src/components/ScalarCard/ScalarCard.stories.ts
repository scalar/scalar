import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarCard, ScalarCardSection, ScalarCardFooter, ScalarCardHeader } from './index'

const meta: Meta<typeof ScalarCard> = {
  component: ScalarCard,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The a11y label for the card region',
    },
  },
  render: (args) => ({
    components: { ScalarCard, ScalarCardHeader, ScalarCardSection, ScalarCardFooter },
    setup() {
      return { args }
    },
    template: `
      <ScalarCard v-bind="args">
        <ScalarCardHeader>Card Header</ScalarCardHeader>
        <ScalarCardSection class="p-3">
          This is the card content area. You can put any content here.
        </ScalarCardSection>
        <ScalarCardFooter class="p-3">
          Card Footer
        </ScalarCardFooter>
      </ScalarCard>
    `,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {},
}

export const WithLabel: Story = {
  args: {
    label: 'Example card',
  },
}

export const WithActions: Story = {
  render: (args) => ({
    components: { ScalarCard, ScalarCardHeader, ScalarCardSection },
    setup() {
      return { args }
    },
    template: `
      <ScalarCard v-bind="args">
        <ScalarCardHeader>
          Card Title
          <template #actions>
            <button>Action</button>
          </template>
        </ScalarCardHeader>
        <ScalarCardSection class="p-3">
          Card with header actions
        </ScalarCardSection>
      </ScalarCard>
    `,
  }),
}

export const Minimal: Story = {
  render: (args) => ({
    components: { ScalarCard, ScalarCardSection },
    setup() {
      return { args }
    },
    template: `
      <ScalarCard v-bind="args">
        <ScalarCardSection class="p-3">
          Simple card with just content
        </ScalarCardSection>
      </ScalarCard>
    `,
  }),
}
