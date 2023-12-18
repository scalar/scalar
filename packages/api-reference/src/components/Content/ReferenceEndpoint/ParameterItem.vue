<script setup lang="ts">
import type { Parameters } from '../../../types'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import Schema from '../Schema.vue'

defineProps<{ parameter: Parameters }>()
</script>
<template>
  <li class="parameter-item">
    <div class="parameter-item-container">
      <!-- Name -->
      <span class="parameter-item-name">
        {{ parameter.name }}
      </span>

      <!-- Optional -->
      <template v-if="parameter.required === true">
        <span class="parameter-item-required-optional parameter-item--required">
          required
        </span>
      </template>
      <!-- Maybe it’s cleaner to just show required, and not "optional". Makes it cleaner. -->
      <!-- <template v-else>
      <span class="parameter-item-required-optional parameter-item--optional">
        optional
      </span>
    </template> -->

      <!-- Type -->
      <span
        v-if="parameter.schema?.type"
        class="parameter-item-type">
        {{ parameter.schema?.type }}
      </span>

      <!-- Description -->
      <MarkdownRenderer
        v-if="parameter.description || parameter.schema?.description"
        class="parameter-item-description"
        :value="parameter.description || parameter.schema?.description" />
    </div>

    <!-- Schema -->
    <template v-if="parameter.schema">
      <div class="parameter-schema">
        <Schema
          v-if="parameter.schema"
          compact
          :level="1"
          toggleVisibility
          :value="parameter.schema" />
      </div>
    </template>
  </li>
</template>

<style scoped>
.parameter-item {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.parameter-item-container {
  padding: 6px 0;
}

.parameter-item-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.parameter-item-type,
.parameter-item-required-optional {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  margin-right: 6px;
  position: relative;
}

.parameter-item--required {
  text-transform: uppercase;
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

.parameter-item-description {
  margin-top: 3px !important;
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.4;
}

.parameter-item-description :deep(p) {
  margin-top: 4px;
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.4;
}

.parameter-schema {
  padding-bottom: 12px;
}
</style>
