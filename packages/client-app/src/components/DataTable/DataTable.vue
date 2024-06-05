<script setup lang="ts">
defineProps<{
  columns: (string | undefined)[]
}>()
</script>
<template>
  <table
    class="grid auto-rows-auto rounded shadow-insetsm bg-b-1 min-h-[31.5px] mx-1 custom-scroll"
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
