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
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'right' | 'bottom' | 'left'
    sideOffset?: number
    class?: string
    triggerClass?: string
    resize?: boolean
    as?: string
    disabled?: boolean
  }>(),
  {
    skipDelay: 1000,
    side: 'top',
    align: 'center',
    disabled: false,
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
        :as="props.as || 'button'"
        class="flex items-center justify-center"
        :class="[props.resize ? 'w-full' : '', props.triggerClass]"
        @click="props.click">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal to=".scalar-client">
        <template v-if="!props.disabled">
          <TooltipContent
            :align="props.align"
            class="scalar-app"
            :class="props.class"
            :side="props.side"
            :sideOffset="props.sideOffset">
            <slot name="content" />
          </TooltipContent>
        </template>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
