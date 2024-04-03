<script setup lang="ts">
import type { Parameters } from '@scalar/oas-utils'

import { SchemaProperty } from '../Schema'

withDefaults(defineProps<{ parameter: Parameters; showChildren?: boolean }>(), {
  showChildren: false,
})
</script>
<template>
  <li class="parameter-item">
    <div class="parameter-item-container">
      <SchemaProperty
        compact
        :description="parameter.description"
        :level="0"
        :name="parameter.name"
        :noncollapsible="showChildren"
        :required="parameter.required"
        :value="parameter.schema" />
    </div>
  </li>
</template>

<style scoped>
.parameter-item {
  border-top: 1px solid var(--scalar-border-color);
}
.parameter-item:last-of-type .parameter-schema {
  padding-bottom: 0;
}
.parameter-item-container {
  padding: 0;
}

.parameter-item-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-1);
}

.parameter-item-type,
.parameter-item-required-optional {
  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  margin-right: 6px;
  position: relative;
}

.parameter-item--required {
  text-transform: uppercase;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-orange);
}

.parameter-item-description {
  margin-top: 3px !important;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  line-height: 1.4;
}

.parameter-item-description :deep(p) {
  margin-top: 4px;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  line-height: 1.4;
}

.parameter-schema {
  padding-bottom: 9px;
  margin-top: 3px;
}
</style>
