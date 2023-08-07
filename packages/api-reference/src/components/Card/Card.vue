<template>
  <div class="card">
    <slot />
  </div>
</template>
<style scoped>
.card {
  border-radius: var(--theme-radius-lg);
  border: 10px solid red;
  overflow: hidden;
  border: 1px solid var(--theme-border-color);
  margin: 12px 0;
}
</style>
