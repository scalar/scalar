<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'radix-vue'

const props = withDefaults(
  defineProps<{
    click?: () => void
    delay?: number
    skipDelay?: number
    side?: 'top' | 'right' | 'bottom' | 'left'
    sideOffset?: number
    class?: string
  }>(),
  {
    skipDelay: 1000,
    side: 'top',
  },
)

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <TooltipProvider
    :delayDuration="props.delay"
    :skipDelayDuration="props.skipDelay">
    <TooltipRoot>
      <TooltipTrigger
        class="w-full"
        @click="props.click">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="scalar-app"
          :class="props.class"
          :side="props.side"
          :sideOffset="props.sideOffset">
          <slot name="content" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
