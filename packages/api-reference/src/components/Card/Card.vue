<template>
  <div class="card">
    <slot />
  </div>
</template>
<style scoped>
.card {
  border-radius: var(--scalar-api-reference-theme-radius-lg);
  overflow: hidden;
  border: 1px solid var(--scalar-api-reference-theme-border-color);
}
</style>
