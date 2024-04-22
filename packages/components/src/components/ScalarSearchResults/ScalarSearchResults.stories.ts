import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarSearchResultItem from './ScalarSearchResultItem.vue'
import ScalarSearchResultList from './ScalarSearchResultList.vue'

const meta = {
  component: ScalarSearchResultList,
  tags: ['autodocs'],
  argTypes: {},
  render: (args) => ({
    components: { ScalarSearchResultList, ScalarSearchResultItem },
    setup() {
      return { args }
    },
    template: `
<ScalarSearchResultList v-bind="args">
  <ScalarSearchResultItem icon="Search">
    Result 1
    <template #description>This is a description</template>
    <template #addon>Addon</template>
  </ScalarSearchResultItem>
  <ScalarSearchResultItem icon="Search">
    Result 2
    <template #description>This is a description</template>
    <template #addon>Addon</template>
  </ScalarSearchResultItem>
  <ScalarSearchResultItem icon="Search">
    Result 3
    <template #description>This is a description</template>
    <template #addon>Addon</template>
  </ScalarSearchResultItem>
</ScalarSearchResultList>`,
  }),
} satisfies Meta<typeof ScalarSearchResultList>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

// export const Loading: Story = {
//   render: () => ({
//     components: { ScalarSearchResultList },
//     setup() {
//       const loadingState = useLoadingState()
//       loadingState.startLoading()
//       return { loadingState }
//     },
//     template: `<ScalarSearchInput modelValue="My search query" :loading="loadingState" />`,
//   }),
// }
