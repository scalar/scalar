<script setup lang="ts"></script>
<template>
  <div class="references-classic-header-container">
    <div class="references-classic-header">
      <div class="references-classic-header-content">
        <slot />
      </div>
      <slot name="dark-mode-toggle" />
    </div>
  </div>
</template>
<style scoped>
.references-classic-header {
  display: flex;
  align-items: center;
  gap: 12px;

  max-width: var(--refs-content-max-width);
  margin: auto;
  padding: 12px 0;
}
.references-classic-header-content {
  display: flex;
  gap: 12px;
  flex-grow: 1;
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
