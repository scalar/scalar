<template>
  <div class="scalar-card">
    <slot />
  </div>
</template>
<style scoped>
.scalar-card {
  all: unset;
  font-family: var(--scalar-font);
  font-size: var(--scalar-font-size-3);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  background: var(--scalar-background-2);
  display: flex;
  flex-direction: column;
  max-height: calc(
    ((var(--full-height) - var(--refs-header-height)) - 60px) / 2
  );
  position: relative;
}
/*
 * Don't constrain card height on mobile
 * (or zoomed in screens)
 */
@media (max-width: 600px) {
  .scalar-card {
    max-height: unset;
  }
}

.scalar-card-sticky {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
</style>
