<script lang="ts">
/**
 * Displays the AsyncAPI operation action (send / receive) in the connection bar,
 * styled like the HTTP method badge in AddressBar. This is a label, not a button.
 */
export default {
  name: 'ChannelActionBadge',
}
</script>

<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import { getChannelActionInfo } from '@/v2/blocks/channel-operation-block/helpers/channel-action-info'

const { action } = defineProps<{
  /** AsyncAPI operation action */
  action: 'send' | 'receive'
}>()

const actionInfo = computed(() => getChannelActionInfo(action))

const variants = cva({
  base: 'text-center font-code text-3xs justify-center items-center flex',
  variants: {
    isSquare: {
      true: 'px-2.5 whitespace-nowrap font-bold border-r h-fit m-auto',
      false: 'rounded-full',
    },
  },
})
</script>

<template>
  <div
    class="relative gap-1 whitespace-nowrap"
    :class="cx(variants({ isSquare: true }), actionInfo.colorClass)"
    :title="`Operation action: ${action}`">
    {{ actionInfo.short }}
  </div>
</template>
