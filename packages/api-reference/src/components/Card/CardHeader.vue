<script lang="ts" setup>
import CardContent from './CardContent.vue'
import type { CardContentProps } from './types'

// eslint-disable-next-line vue/no-unused-properties
const props = defineProps<CardContentProps>()
</script>
<template>
  <CardContent
    v-bind="props"
    class="scalar-card-header">
    <div class="scalar-card-header-slots">
      <div class="scalar-card-header-slot scalar-card-header-title">
        <slot />
      </div>
      <div class="scalar-card-header-slot scalar-card-header-actions">
        <slot name="actions" />
      </div>
    </div>
  </CardContent>
</template>
<style scoped>
.scalar-card-header {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-3);
  padding: 9px 0 9px 12px;
  flex-shrink: 0;
}
.scalar-card-header.scalar-card--borderless + :deep(.scalar-card-content) {
  margin-top: -9px;
}
.scalar-card-header-slots {
  display: flex;
  justify-content: space-between;
  line-height: 1.35;
}

.scalar-card-header-title {
  text-transform: uppercase;
  flex: 1;
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

.scalar-card-header-actions {
  display: flex;
}
</style>
