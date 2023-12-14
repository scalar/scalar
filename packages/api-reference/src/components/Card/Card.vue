<template>
  <div class="scalar-card">
    <slot />
  </div>
</template>
<style scoped>
.scalar-card {
  all: unset;
  font-family: var(--theme-font, var(--default-theme-font));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  background: var(--theme-background-2, var(--default-theme-background-2));
  display: flex;
  flex-direction: column;
  max-height: calc(
    ((var(--full-height) - var(--refs-header-height)) - 60px) / 2
  );
  position: relative;
}

.scalar-card-sticky {
  position: sticky;
  top: 24px;
}
</style>
