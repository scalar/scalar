<script lang="ts" setup>
import CardContent from './CardContent.vue'
import { type CardContentProps } from './types'

// eslint-disable-next-line vue/no-unused-properties
const props = defineProps<CardContentProps>()
</script>
<template>
  <CardContent v-bind="props">
    <slot />
  </CardContent>
</template>
<style scoped>
.scalar-card-footer {
  flex-shrink: 0;
}
</style>
