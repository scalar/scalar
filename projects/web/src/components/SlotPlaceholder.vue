<template>
  <div class="refs-slot-placeholder-wrapper">
    <div class="refs-slot-placeholder">&lt;template #<slot />&gt;</div>
  </div>
</template>
<style scoped>
.refs-slot-placeholder-wrapper {
  display: grid;
  border-color: var(--default-theme-border-color);
  padding: 4px;
}
.refs-slot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 16px 24px;

  outline: dashed 1px var(--default-theme-color-3);
  border-radius: var(--default-theme-radius);

  font-size: 0.6rem;
  font-family: var(--default-theme-font-code);
  color: var(--default-theme-color-2);
}
</style>
