<script lang="ts">
/**
 * WebSocket protocol label for the channel connection bar (like HTTP method badges).
 */
export default {
  name: 'WebSocketProtocolBadge',
}
</script>

<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'

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
    class="text-purple relative gap-1 whitespace-nowrap"
    :class="cx(variants({ isSquare: true }))"
    title="WebSocket channel">
    WS
  </div>
</template>
