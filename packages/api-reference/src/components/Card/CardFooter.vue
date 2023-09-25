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
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
