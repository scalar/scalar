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

const { action, variant = 'bar' } = defineProps<{
  /** AsyncAPI operation action */
  action: 'send' | 'receive'
  /**
   * `bar` — address bar cell (border-right, centered).
   * `inline` — compact label in lists and reference sections.
   */
  variant?: 'bar' | 'inline'
}>()

const actionInfo = computed(() => getChannelActionInfo(action))

const variants = cva({
  base: 'font-code text-3xs flex shrink-0 items-center justify-center whitespace-nowrap font-bold',
  variants: {
    variant: {
      bar: 'text-center border-r h-fit m-auto px-2.5',
      inline: 'rounded px-1.5 py-0.5',
    },
  },
})
</script>

<template>
  <div
    class="relative"
    :class="cx(variants({ variant }), actionInfo.colorClass)"
    :title="`Operation action: ${action}`">
    {{ actionInfo.short }}
  </div>
</template>
