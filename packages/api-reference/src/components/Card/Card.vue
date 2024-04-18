<template>
  <div class="scalar-card">
    <slot />
  </div>
</template>
<style scoped>
.scalar-card {
  all: unset;
  font-family: var(--scalar-font);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-2);
  display: flex;
  flex-direction: column;
  max-height: calc(
    ((var(--full-height) - var(--refs-header-height)) - 60px) / 2
  );
  position: relative;
}

.scalar-card-sticky {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
</style>
