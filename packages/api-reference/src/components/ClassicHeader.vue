<script setup lang="ts"></script>
<template>
  <div class="references-classic-header-container">
    <div class="references-classic-header">
      <slot />
      <slot name="dark-mode-toggle" />
    </div>
  </div>
</template>
<style scoped>
.references-classic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  max-width: var(--refs-content-max-width);
  margin: auto;
  padding: 12px 0;
}
.references-classic-header-container {
  padding: 0 60px;
}
@container narrow-references-container (max-width: 900px) {
  .references-classic-header {
    padding: 12px 24px;
  }
  .references-classic-header-container {
    padding: 0;
  }
}
.references-classic-header-icon {
  height: 24px;
  color: var(--scalar-color-1);
}
</style>
