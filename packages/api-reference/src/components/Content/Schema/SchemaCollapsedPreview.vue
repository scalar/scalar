<script setup lang="ts">
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

/**
 * A hint at what a collapsed object holds: `{ code, message, source, +1 }`.
 * Marked `aria-hidden` by the parent: the child count already rides the
 * toggle's `aria-describedby`, and reading names before every row is noise.
 */
const {
  schema,
  propertyNames,
  limit = 3,
} = defineProps<{
  schema?: SchemaObject
  /** The names the panel will render, already filtered; defaults to the schema's keys */
  propertyNames?: string[]
  /** How many property names to show before eliding the rest */
  limit?: number
}>()

const preview = computed((): string | null => {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  /*
   * The caller passes the names the panel will render, filtered by
   * hideReadOnly / hideWriteOnly; deriving them here let the preview advertise
   * fields the panel drops. The fallback (stories, tests) reads `properties`
   * directly: `resolve.schema` keeps `$ref` but drops `$ref-value`, so resolving
   * again returned undefined for a `$ref` property and nothing rendered.
   */
  const resolved =
    'properties' in schema ? schema : (getResolvedRef(schema) ?? schema)
  const properties =
    propertyNames ??
    (resolved && 'properties' in resolved && resolved.properties
      ? Object.keys(resolved.properties)
      : [])

  if (properties.length === 0) {
    return null
  }

  const shown = properties.slice(0, limit)
  const rest = properties.length - shown.length
  const parts = rest > 0 ? [...shown, `+${rest}`] : shown

  return `{ ${parts.join(', ')} }`
})
</script>
<template>
  <span
    v-if="preview"
    class="property-collapsed-preview font-code text-c-1 max-w-max min-w-0 flex-1 basis-0 truncate text-(length:--scalar-mini)"
    >{{ preview }}</span
  >
</template>
