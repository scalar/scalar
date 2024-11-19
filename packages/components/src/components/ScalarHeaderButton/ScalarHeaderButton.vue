<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>
<template>
  <button
    class="flex min-w-[37px] max-w-[37px] items-center justify-center rounded-lg p-2 font-medium no-underline hover:bg-b-3 sm:min-w-max sm:max-w-max sm:rounded sm:py-1.5"
    type="button">
    <slot>
      {{ label }}
    </slot>
  </button>
</template>
