<script setup lang="ts">
const { selected } = defineProps<{
  selected?: boolean
}>()
</script>
<template>
  <!--
    Deliberately no aria-controls. While the focused tab controls a visible
    panel, NVDA re-announces every tab whose aria-selected changes (Chromium
    fires a selection event, see nvaccess/nvda#18794), so arrow keys read
    "Auth tab selected 2 of 6" twice. Screen readers do not need the relation
    to convey the tabs' name, role and state.
  -->
  <button
    :aria-selected="!!selected"
    class="hover:bg-b-2 flex w-fit cursor-pointer items-center rounded p-1 px-2 text-center font-medium whitespace-nowrap has-[:focus-visible]:outline"
    :class="{ 'text-c-1 pointer-events-none': selected }"
    role="tab"
    :tabindex="selected ? 0 : -1"
    type="button">
    <slot />
  </button>
</template>
