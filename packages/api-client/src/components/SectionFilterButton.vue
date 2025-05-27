<script setup lang="ts">
const { selected, controls } = defineProps<{
  selected?: boolean
  controls?: string | undefined
}>()
</script>
<template>
  <button
    :aria-controls="controls ?? ''"
    :aria-selected="!!selected"
    class="hover:bg-b-2 flex w-fit cursor-pointer items-center rounded p-1 px-2 text-center font-medium whitespace-nowrap has-[:focus-visible]:outline"
    :class="{ 'text-c-1 pointer-events-none': selected }"
    role="tab"
    :tabindex="selected ? 0 : -1"
    type="button">
    <slot />
  </button>
</template>
