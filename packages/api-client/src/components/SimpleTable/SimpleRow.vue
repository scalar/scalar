<template>
  <tr class="simple-row">
    <slot />
  </tr>
</template>
<style scoped>
.simple-row {
  box-shadow: 0 -1px var(--theme-border-color, var(--default-theme-border-color));
}
.simple-row:first-of-type {
  box-shadow: none;
}
</style>
