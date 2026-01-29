<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from 'radix-vue'

const props = withDefaults(
  defineProps<{
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'right' | 'bottom' | 'left'
    sideOffset?: number
    disabled?: boolean
    triggerClass?: string
  }>(),
  {
    side: 'bottom',
    align: 'center',
    disabled: false,
  },
)
</script>

<template>
  <ContextMenuRoot
    class="bg-red"
    container="#headlessui-portal-root"
    style="background-color: red">
    <ContextMenuTrigger
      :class="triggerClass"
      :disabled="props.disabled">
      <slot name="trigger" />
    </ContextMenuTrigger>
    <ContextMenuPortal class="bg-blue">
      <ContextMenuContent
        :align="props.align"
        :side="props.side"
        :sideOffset="props.sideOffset">
        <ContextMenuItem>
          <slot name="content" />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
