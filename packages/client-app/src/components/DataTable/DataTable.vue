<script setup lang="ts">
defineProps<{
  columns: (string | undefined)[]
  /** Scroll horizontally */
  scroll?: boolean
}>()
</script>
<template>
  <div
    class="border-1/2 rounded mx-1 bg-b-1"
    :class="scroll ? 'overflow-x-auto custom-scroll' : 'overflow-visible'">
    <table
      class="grid auto-rows-auto min-h-8"
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
