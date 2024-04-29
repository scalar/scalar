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
    Result 2 - Extra long result title that might need to be truncated
    <template #description>This is a really long description that might need to be truncated</template>
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

export const NoResults: Story = {
  render: () => ({
    components: { ScalarSearchResultList },
    template: `
<ScalarSearchResultList noResults>
  <template #query>search query</template>
</ScalarSearchResultList>`,
  }),
}
