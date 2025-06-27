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
    short>
    <slot />
  </HttpMethod>
</template>

<style scoped>
.sidebar-heading-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  line-height: 14px;
  flex-shrink: 0;
  text-transform: uppercase;
  color: var(--method-color, var(--scalar-color-1));
  font-size: 10px;
  font-weight: var(--scalar-bold);
  font-family: var(--scalar-font-code);
  white-space: nowrap;
}
</style>
