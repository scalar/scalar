<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components'

defineProps<{
  label: string
  description?: string
}>()
</script>

<template>
  <li class="property-enum-value">
    <div class="property-enum-value-content">
      <span class="property-enum-value-label">{{ label }}</span>
      <span
        v-if="description"
        class="property-enum-value-description">
        <ScalarMarkdown :value="description" />
      </span>
    </div>
  </li>
</template>

<style scoped>
.property-enum-value {
  /**
   * Firefox might not render values below 1px correctly on low-resolution displays.
   * We want to make sure we use a value that's at least 1px.
   * To make it look lighter/thinner, we lower the opacity.
  */
  --enum-border-width: 1px;
  --enum-border-opacity: 0.5;
  color: var(--scalar-color-3);
  line-height: 1.5;
  word-break: break-word;
  display: flex;
  align-items: stretch;
  position: relative;
}

.property-enum-value-content {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}

.property-enum-value-label {
  display: flex;
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  position: relative;
}

.property-enum-value:last-of-type .property-enum-value-label {
  padding-bottom: 0;
}

.property-enum-value::before {
  content: '';
  margin-right: 12px;
  width: var(--enum-border-width);
  opacity: var(--enum-border-opacity);
  display: block;
  background: currentColor;
  color: var(--scalar-color-3);
}

.property-enum-value:last-of-type::before,
.property-enum-values:has(.enum-toggle-button)
  .property-enum-value:nth-last-child(2)::before {
  height: 14px;
}

.property-enum-value:not(:last-child)::before {
  content: '';
  margin-right: 12px;
  width: var(--enum-border-width);
  opacity: var(--enum-border-opacity);
  display: block;
  background: currentColor;
  color: var(--scalar-color-3);
}

.property-enum-value-label::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -12px;
  width: 8px;
  height: var(--enum-border-width);
  background: var(--scalar-color-2);
  opacity: var(--enum-border-opacity);
}

.property-enum-value:last-of-type::after {
  bottom: 0;
  height: 50%;
  background: var(--scalar-background-1);
  border-top: var(--enum-border-width) solid currentColor;
  opacity: var(--enum-border-opacity);
}

.property-enum-value-description {
  color: var(--scalar-color-3);
}
</style>
