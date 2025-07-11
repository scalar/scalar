<script lang="ts" setup>
import { useBindCx } from '@scalar/components'

import CardContent from './CardContent.vue'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <CardContent v-bind="cx('scalar-card-header')">
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
  font-size: var(--scalar-small);
  color: var(--scalar-color-1);
  font-weight: var(--scalar-font-medium);
  padding: 9px 3px 9px 12px;
  flex-shrink: 0;
}
.scalar-card-header.scalar-card--borderless + :deep(.scalar-card-content) {
  margin-top: -9px;
}
.scalar-card-header-slots {
  flex: 1;
  display: flex;
  justify-content: space-between;
  line-height: 1.35;
}

.scalar-card-header-title {
  flex: 1;
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

.scalar-card-header-actions {
  display: flex;
}
</style>
