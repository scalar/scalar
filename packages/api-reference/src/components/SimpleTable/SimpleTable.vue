<template>
  <table class="simple-table">
    <slot />
  </table>
</template>

<style scoped>
.simple-table {
  all: unset;
  display: table;
  width: 100%;
  font-size: var(--theme-micro, var(--default-theme-micro));
}
</style>
