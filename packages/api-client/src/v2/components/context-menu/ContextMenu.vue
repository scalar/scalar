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
  <ContextMenuRoot>
    <ContextMenuTrigger
      :class="triggerClass"
      :disabled="props.disabled">
      <slot name="trigger" />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent
        :align="props.align"
        class="scalar-api-client-context-menu"
        :side="props.side"
        :sideOffset="props.sideOffset">
        <ContextMenuItem>
          <slot name="content" />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<style>
@reference "@/style.css";

/**
 * The content wrapper (data-radix-popper-content-wrapper) creates
 * a new stacking context, so we need to override the z-index there.
 * We need to target our own context menu class to keep the styles from
 * leaking out and affecting other Radix UI components.
 */
[data-radix-popper-content-wrapper]:has(.scalar-api-client-context-menu) {
  /**
   * We have to use important because Radix UI sets the z-index in a style
   * attribute on the content wrapper.
   */
  @apply z-context!;
}
</style>
