<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarWrappingText } from '@scalar/components/wrapping-text'

defineProps<{
  label: string
  description?: string
  /** The schema layout this value renders inside */
  layout?: 'legacy' | 'tree'
}>()
</script>

<template>
  <!-- Tree layout row. A fresh class name keeps the legacy decorators below off it -->
  <li
    v-if="layout === 'tree'"
    class="property-enum-row flex flex-col gap-0.5 border-t px-3 py-2">
    <span class="property-enum-row-label font-code text-c-1 text-sm">
      <ScalarWrappingText
        :text="label"
        preset="property" />
    </span>
    <span
      v-if="description"
      class="property-enum-row-description text-c-2 text-(length:--scalar-small) [&_.markdown]:-mb-0.5">
      <ScalarMarkdown :value="description" />
    </span>
  </li>
  <li
    v-else
    class="property-enum-value">
    <div class="property-enum-value-content">
      <span class="property-enum-value-label">
        <ScalarWrappingText
          :text="label"
          preset="property" />
      </span>
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
  color: var(--scalar-color-3);
  line-height: 1.5;
  overflow-wrap: break-word;
  display: flex;
  align-items: stretch;
  position: relative;

  --decorator-width: 1px;
  --decorator-color: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-color-1) 25%
  );
}

.property-enum-value-content {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}

.property-enum-value-label {
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  font-size: var(--scalar-font-size-4);
  position: relative;
}

.property-enum-value:last-of-type .property-enum-value-label {
  padding-bottom: 0;
}

.property-enum-value::before {
  content: '';
  margin-right: 12px;
  width: var(--decorator-width);
  display: block;
  background-color: var(--decorator-color);
}

.property-enum-value:last-of-type::before,
.property-enum-values:has(.enum-toggle-button)
  .property-enum-value:nth-last-child(2)::before {
  height: calc(0.5lh + 4px);
}

.property-enum-value-label::after {
  content: '';
  position: absolute;
  top: calc(0.5lh);
  left: -12px;
  width: 8px;
  height: var(--decorator-width);
  background-color: var(--decorator-color);
}

.property-enum-value:last-of-type::after {
  bottom: 0;
  height: 50%;
  background: var(--scalar-background-1);
  border-top: var(--scalar-border-width) solid var(--decorator-color);
}

.property-enum-value-description {
  color: var(--scalar-color-3);
}
</style>
