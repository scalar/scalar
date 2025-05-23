<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'

defineProps<{
  method: string
  active?: boolean
}>()
</script>

<template>
  <HttpMethod
    :class="[
      'sidebar-heading-type',
      `sidebar-heading-type--${method.toLowerCase()}`,
      { 'sidebar-heading-type-active': active },
    ]"
    :method="method"
    property="--method-color"
    short />
</template>

<style scoped>
.sidebar-heading-type {
  display: block;
  min-width: 3.9em;
  overflow: hidden;
  line-height: 14px;
  flex-shrink: 0;
  color: white;
  color: color-mix(
    in srgb,
    var(--method-color, var(--scalar-color-1)),
    transparent 0%
  );
  text-transform: uppercase;
  font-size: 10px;
  font-weight: var(--scalar-bold);
  text-align: right;
  position: relative;
  font-family: var(--scalar-font-code);
  white-space: nowrap;
  margin-left: 3px;
}
</style>
