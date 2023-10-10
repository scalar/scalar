<template>
  <div class="card">
    <slot />
  </div>
</template>
<style scoped>
.card {
  font-family: var(--theme-font, var(--default-theme-font));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  background: var(--theme-background-2, var(--default-theme-background-2));
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 310px);
}
</style>
