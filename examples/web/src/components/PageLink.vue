<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@scalar/api-reference'
import { RouterLink } from 'vue-router'

defineProps<{
  to: string
}>()
</script>
<template>
  <RouterLink :to="{ name: to }">
    <Card>
      <CardHeader>
        <slot name="title" />
      </CardHeader>
      <CardContent class="description">
        <slot name="description" />
      </CardContent>
    </Card>
  </RouterLink>
</template>

<style scoped>
a {
  text-decoration: none;
  color: var(--default-theme-color-2);
}

.description {
  padding: 10px;
  min-height: 75px;
  font-size: var(--default-theme-small);
  line-height: 1.5;
}
</style>
