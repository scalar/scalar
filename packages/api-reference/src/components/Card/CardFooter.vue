<script lang="ts" setup>
import CardContent from './CardContent.vue'
</script>
<template>
  <CardContent>
    <slot />
  </CardContent>
</template>
<style scoped>
.card-footer {
  border-top: 1px solid var(--scalar-api-reference-theme-border-color);
}
</style>
