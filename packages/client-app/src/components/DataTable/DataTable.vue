<script setup lang="ts">
defineProps<{
  columns: (string | undefined)[]
}>()
</script>
<template>
  <table
    class="grid auto-rows-auto rounded shadow-border-1/2 bg-b-1 min-h-8 mx-1 custom-scroll"
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
</template>
