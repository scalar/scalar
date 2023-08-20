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
  font-weight: var(--theme-semibold);
  font-size: var(--theme-micro);
  color: var(--theme-color-3);
}

.card-header-title {
  text-transform: uppercase;
}

.card-header-slots {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-actions {
  display: flex;
  align-items: center;
}
</style>
