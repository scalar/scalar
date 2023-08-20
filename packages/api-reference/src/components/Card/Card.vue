<template>
  <div class="card">
    <slot />
  </div>
</template>
<style scoped>
.card {
  border-radius: var(--theme-radius-lg);
  overflow: hidden;
  border: 1px solid var(--theme-border-color);
}
</style>
