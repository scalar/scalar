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
  flex-shrink: 0;
}
</style>
