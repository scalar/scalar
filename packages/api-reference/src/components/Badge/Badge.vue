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
}
.badge.text-orange {
  background: color-mix(in srgb, var(--scalar-color-orange), transparent 90%);
  border: transparent;
}
.badge.text-yellow {
  background: color-mix(in srgb, var(--scalar-color-yellow), transparent 90%);
  border: transparent;
}
.badge.text-red {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 90%);
  border: transparent;
}
.badge.text-purple {
  background: color-mix(in srgb, var(--scalar-color-purple), transparent 90%);
  border: transparent;
}
.badge.text-green {
  background: color-mix(in srgb, var(--scalar-color-green), transparent 90%);
  border: transparent;
}
</style>
