<script setup lang="ts">
defineProps<{
  level: number
}>()
</script>
<template>
  <ul
    class="sidebar-group sidebar-indent-nested"
    :style="{ '--sidebar-level': level }">
    <slot />
  </ul>
</template>
