<script setup lang="ts">
import { tw } from '@scalar/components'

const { tableClass = '' } = defineProps<{
  columns: (string | undefined)[]
  tableClass?:
    | string
    | Record<string, boolean>
    | (string | Record<string, boolean>)[]
    | false
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
      :class="[
        { 'min-w-full w-max': scroll },
        tw('table min-h-8 mb-0', tableClass as string),
      ]"
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
