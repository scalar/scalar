<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'radix-vue'

import { ScalarTeleport } from '../ScalarTeleport'

const variants = cva({
  base: 'scalar-app z-overlay',
  variants: {
    textSize: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
    },
  },
})

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
    textSize?: 'xs' | 'sm' | 'base'
  }>(),
  {
    skipDelay: 1000,
    side: 'top',
    align: 'center',
    disabled: false,
    textSize: 'xs',
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
      <ScalarTeleport>
        <TooltipContent
          v-if="!props.disabled"
          :align="props.align"
          :class="cx(variants({ textSize: props.textSize }), props.class)"
          :side="props.side"
          :sideOffset="props.sideOffset">
          <slot name="content" />
        </TooltipContent>
      </ScalarTeleport>
    </TooltipRoot>
  </TooltipProvider>
</template>
