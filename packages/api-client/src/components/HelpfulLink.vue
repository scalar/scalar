<script lang="ts" setup>
defineProps<{ href: string }>()
</script>
<template>
  <a
    class="cursor-help decoration-c-3 underline underline-offset-2"
    :href="href"
    rel="noopener noreferrer"
    target="_blank">
    <slot />
  </a>
</template>
