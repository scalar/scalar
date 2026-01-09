<script lang="ts" setup>
import { ScalarWrappingText } from '@scalar/components'

import type { Item } from '@/types'

const { item } = defineProps<{
  /**
   * The sidebar item to render.
   */
  item: Item
  /**
   * The source of the operation title.
   */
  operationTitleSource?: 'path' | 'summary'
}>()
</script>
<template>
  <template v-if="item.type === 'model'">
    <ScalarWrappingText
      preset="property"
      :text="item.title" />
  </template>
  <template v-else>
    <ScalarWrappingText
      :text="
        operationTitleSource === 'path' && 'path' in item
          ? (item.path as string)
          : (item.title as string)
      " />
  </template>
</template>
