<script setup lang="ts">
import { HttpMethod } from '@scalar/api-client'

defineProps<{
  active?: boolean
  method: string
}>()
</script>
<template>
  <HttpMethod
    class="sidebar-heading-type"
    :class="{ 'sidebar-heading-type-active': active }"
    :method="method"
    property="--method-color"
    short />
</template>
<style scoped>
.sidebar-heading-type {
  display: block;
  min-width: 3.9em;
  overflow: hidden;
  border-radius: 30px;
  padding: 0 3px;
  line-height: 14px;
  flex-shrink: 0;
  color: white;
  color: color-mix(
    in srgb,
    var(--method-color, var(--scalar-color-1)),
    transparent 0%
  );
  background: var(--method-color, var(--scalar-background-3));
  background: color-mix(
    in srgb,
    var(--method-color, var(--scalar-background-3)),
    transparent 90%
  );
  text-transform: uppercase;
  font-size: 8.5px;
  font-weight: bold;
  text-align: center;
  position: relative;
  font-family: var(--scalar-font-code);
  white-space: nowrap;
  margin-left: 3px;
}
.sidebar-heading-type-active {
  background: var(--method-color, transparent);
  color: color-mix(in srgb, var(--method-color), white 85%);
}
.dark-mode .sidebar-heading-type-active {
  background: var(--method-color, transparent);
  color: color-mix(in srgb, var(--method-color), black 80%);
}
</style>
