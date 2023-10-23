<template>
  <table class="simple-table">
    <slot />
  </table>
</template>

<style scoped>
.simple-table {
  display: table;
  width: 100%;
  border-spacing: 0;
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
</style>
