<template>
  <footer class="refs-slot-placeholder">&lt;template #<slot />&gt;</footer>
</template>
<style scoped>
.refs-slot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 16px 24px;

  outline: dashed 1px var(--default-theme-color-3);
  outline-offset: -4px;
  border-radius: 8px;

  font-size: 0.6rem;
  font-family: var(--default-theme-font-code);
  color: var(--default-theme-color-2);
}
</style>
