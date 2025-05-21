<script setup lang="ts">
import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
} from '@scalar/openapi-types'

defineProps<{
  value?:
    | OpenAPIV2.ExternalDocumentationObject
    | OpenAPIV3.ExternalDocumentationObject
    | OpenAPIV3_1.ExternalDocumentationObject
}>()
</script>

<template>
  <template v-if="value">
    <a
      :href="value.url"
      class="external-docs-link">
      {{ value.description || value.url }}
    </a>
  </template>
</template>

<style scoped>
.external-docs-link {
  color: var(--scalar-link-color, var(--scalar-color-accent));
  font-weight: var(--scalar-link-font-weight, inherit);
  text-decoration: var(--scalar-text-decoration) !important;
  text-decoration-color: var(--scalar-text-decoration-color);
  font-size: var(--scalar-paragraph);
  cursor: pointer;
}

.external-docs-link:hover {
  color: var(--scalar-link-color-hover, var(--scalar-color-accent));
  text-decoration: var(--scalar-text-decoration-hover) !important;
  text-decoration-color: var(--scalar-text-decoration-color-hover);
}
</style>
