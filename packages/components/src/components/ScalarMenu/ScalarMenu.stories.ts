import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarMenu } from './'

const meta = {
  component: ScalarMenu,
  tags: ['autodocs'],
  argTypes: {},
  render: (args) => ({
    components: { ScalarMenu },
    setup() {
      return { args }
    },
    template: `
<ScalarMenu v-bind="args">
</ScalarMenu>`,
  }),
} satisfies Meta<typeof ScalarMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

// export const NoResults: Story = {
//   render: () => ({
//     components: { ScalarSearchResultList },
//     template: `
// <ScalarSearchResultList noResults>
//   <template #query>search query</template>
// </ScalarSearchResultList>`,
//   }),
// }
