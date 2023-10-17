<template>
  <tr class="simple-row">
    <slot />
  </tr>
</template>
<style scoped>
.simple-row {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.simple-row:first-of-type {
  border-top: none;
}
</style>
