<template>
  <div class="badge">
    <slot />
  </div>
</template>

<style scoped>
.badge {
  color: var(--scalar-color-2);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: var(--scalar-semibold);
  display: inline-block;
  text-transform: uppercase;
}
</style>
