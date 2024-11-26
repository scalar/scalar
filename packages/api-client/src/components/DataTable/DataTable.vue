<script setup lang="ts">
import { tw } from '@scalar/components'

defineProps<{
  columns: (string | undefined)[]
  /** Scroll horizontally */
  scroll?: boolean
}>()
</script>
<template>
  <div
    :class="[
      scroll ? 'overflow-x-auto custom-scroll' : 'overflow-visible',
      tw('scalar-data-table border-1/2 rounded bg-b-1', $attrs.class as string),
    ]">
    <table
      class="grid auto-rows-auto min-h-8 mb-0"
      :class="{ 'min-w-full w-max': scroll }"
      :style="{
        gridTemplateColumns: columns.map((col) => col || '1fr').join(' '),
      }">
      <caption
        v-if="$slots.caption"
        class="sr-only">
        <slot name="caption" />
      </caption>
      <slot />
    </table>
  </div>
</template>
