<template>
  <tr class="simple-row">
    <slot />
  </tr>
</template>
<style scoped>
.simple-row {
  border-top: 1px solid var(--theme-border-color);
}

.simple-row:last-of-type {
  border-bottom: 1px solid var(--theme-border-color);
}
</style>
