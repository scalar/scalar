<template>
  <table class="simple-table">
    <slot />
  </table>
</template>

<style scoped>
.simple-table {
  display: table;
  width: 100%;
  font-size: var(--theme-micro, var(--default-theme-micro));
}
</style>
