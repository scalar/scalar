<template>
  <div class="card">
    <slot />
  </div>
</template>
<style scoped>
.card {
  border-radius: var(--scalar-api-reference-rounded-lg);
  overflow: hidden;
  border: 1px solid var(--scalar-api-reference-border-color);
}
</style>
