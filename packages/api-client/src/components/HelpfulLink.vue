<script lang="ts" setup>
defineProps<{ href: string }>()
</script>
<template>
  <a
    class="decoration-c-3 cursor-help underline underline-offset-2"
    :href="href"
    rel="noopener noreferrer"
    target="_blank">
    <slot />
  </a>
</template>
