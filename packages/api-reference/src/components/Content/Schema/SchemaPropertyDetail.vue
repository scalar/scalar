<script lang="ts" setup>
defineProps<{
  truncate?: boolean
  code?: boolean
}>()
</script>
<template>
  <span
    class="property-detail"
    :class="{ 'property-detail-truncate': truncate }">
    <div
      v-if="$slots.prefix"
      class="property-detail-prefix">
      <slot name="prefix" />&nbsp;
    </div>
    <code
      v-if="code"
      class="property-detail-value">
      <slot />
    </code>
    <span
      v-else
      class="property-detail-value">
      <slot />
    </span>
  </span>
</template>
<style scoped>
.property-detail {
  display: inline-flex;
}
.property-detail + .property-detail:before {
  display: block;
  content: '·';
  margin: 0 0.5ch;
}
.property-detail-truncate {
  overflow: hidden;
}

.property-detail-truncate > .property-detail-value {
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-detail-prefix {
  color: var(--theme-color-3, var(--default-theme-color-3));
}

code.property-detail-value {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-2, var(--default-theme-color-2));
  background: var(--theme-background-3, var(--default-theme-background-3));
  padding: 1px 3px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
</style>
