<template>
  <th class="simple-header">
    <slot />
  </th>
</template>
<style>
.simple-header {
  color: var(--scalar-api-client-color-3);
  border-right: var(--scalar-api-client-border);
  font-weight: var(--scalar-api-client-font-bold);
  text-transform: uppercase;
  padding: 0.75em;
}
</style>
