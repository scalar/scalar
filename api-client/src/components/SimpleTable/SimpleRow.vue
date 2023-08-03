<template>
  <tr class="simple-row">
    <slot />
  </tr>
</template>
<style>
.simple-row {
  border-top: var(--scalar-api-client-border);
}

.simple-row:last-of-type {
  border-bottom: var(--scalar-api-client-border);
}
</style>
