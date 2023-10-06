<script lang="ts" setup>
import CardContent from './CardContent.vue'
</script>
<template>
  <CardContent class="card-header">
    <div class="card-header-slots">
      <div class="card-header-slot card-header-title">
        <slot />
      </div>
      <div class="card-header-slot card-header-actions">
        <slot name="actions" />
      </div>
    </div>
  </CardContent>
</template>
<style scoped>
.card-header {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-3, var(--default-theme-color-3));
}

.card-header-slots {
  display: flex;
  justify-content: space-between;
  margin: 9px 12px;
  line-height: 1.35;
}

.card-header-title {
  text-transform: uppercase;
  word-break: break-all;
}

.card-header-actions {
  display: flex;
}
</style>
