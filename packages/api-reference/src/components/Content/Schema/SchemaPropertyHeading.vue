<script lang="ts" setup>
import { isDefined } from '@scalar/helpers/array/is-defined'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

import SchemaPropertyExamples from '@/components/Content/Schema/SchemaPropertyExamples.vue'
import ScreenReader from '@/components/ScreenReader.vue'
import type { Schemas } from '@/features/Operation/types/schemas'
import { getDiscriminatorSchemaName } from '@/hooks/useDiscriminator'

import { Badge } from '../../Badge'
import { getModelName } from './helpers/schema-name'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'

const {
  value,
  schemas,
  required = false,
  withExamples = true,
  hideModelNames = false,
} = defineProps<{
  value?: Record<string, any>
  enum?: boolean
  required?: boolean
  additional?: boolean
  pattern?: boolean
  withExamples?: boolean
  hideModelNames?: boolean
  schemas?: Schemas
}>()

const flattenDefaultValue = (value: Record<string, any>) => {
  if (value?.default === null) {
    return 'null'
  }

  if (Array.isArray(value?.default) && value.default.length === 1) {
    return value.default[0]
  }

  if (typeof value?.default === 'string') {
    return JSON.stringify(value.default)
  }

  return value?.default
}

const constValue = computed(() => {
  if (isDefined(value?.const)) {
    return value?.const
  }

  if (value?.enum?.length === 1) {
    return value.enum[0]
  }

  if (value?.items) {
    if (isDefined(value.items.const)) {
      return value.items.const
    }

    if (value.items.enum?.length === 1) {
      return value.items.enum[0]
    }
  }
  return null
})

/** Computes the human-readable type for a schema property. */
const displayType = computed(() => {
  if (Array.isArray(value?.type)) {
    return value.type.join(' | ')
  }

  if (value?.title) {
    return value.title
  }

  if (value?.name) {
    return value.name
  }

  if (value?.type && value.contentEncoding) {
    return `${value.type} • ${value.contentEncoding}`
  }

  return value?.type ?? ''
})

/** Gets the model name */
const modelName = computed(() => {
  if (!value) {
    return null
  }

  return getModelName(
    value,
    schemas,
    hideModelNames,
    getDiscriminatorSchemaName,
  )
})
</script>
<template>
  <div class="property-heading">
    <div
      v-if="$slots.name"
      class="property-name"
      :class="{ deprecated: value?.deprecated }">
      <slot
        v-if="!pattern"
        name="name" />
      <template v-else>&sol;<slot name="name" />&sol;</template>
    </div>
    <div
      v-if="value?.isDiscriminator"
      class="property-discriminator">
      Discriminator
    </div>
    <template v-if="value">
      <SchemaPropertyDetail v-if="value?.type">
        <ScreenReader>Type:</ScreenReader>
        <template v-if="modelName">
          {{ modelName }}
        </template>
        <template v-else>
          {{ displayType }}
          {{ value?.nullable ? ' | nullable' : '' }}
        </template>
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.minItems || value.maxItems">
        {{ value.minItems }}&hellip;{{ value.maxItems }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.minLength">
        <template #prefix>min:</template>
        {{ value.minLength }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.maxLength">
        <template #prefix>max:</template>
        {{ value.maxLength }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.uniqueItems">
        unique!
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.format">
        <ScreenReader>Format:</ScreenReader>
        {{ value.format }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="isDefined(value.minimum) && value.exclusiveMinimum">
        <template #prefix>greater than:</template>
        {{ value.minimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="isDefined(value.minimum) && !value.exclusiveMinimum">
        <template #prefix>min:</template>
        {{ value.minimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="isDefined(value.maximum) && value.exclusiveMaximum">
        <template #prefix>less than:</template>
        {{ value.maximum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="isDefined(value.maximum) && !value.exclusiveMaximum">
        <template #prefix>max:</template>
        {{ value.maximum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="isDefined(value.multipleOf)">
        <template #prefix>multiple of:</template>
        {{ value.multipleOf }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.pattern"
        code
        truncate>
        <ScreenReader>Pattern:</ScreenReader>
        {{ value.pattern }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="$props.enum">enum</SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.default !== undefined"
        truncate>
        <template #prefix>default:</template>
        {{ flattenDefaultValue(value) }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="additional"
      class="property-additional">
      <template v-if="value?.['x-additionalPropertiesName']">
        {{ value['x-additionalPropertiesName'] }}
      </template>
      <template v-else>additional properties</template>
    </div>
    <div
      v-if="pattern"
      class="property-pattern">
      <Badge>pattern</Badge>
    </div>
    <div
      v-if="value?.deprecated"
      class="property-deprecated">
      <Badge>deprecated</Badge>
    </div>
    <div
      v-if="isDefined(constValue)"
      class="property-const">
      <SchemaPropertyDetail truncate>
        <template #prefix>const:</template>
        {{ constValue }}
      </SchemaPropertyDetail>
    </div>
    <template v-else>
      <!-- Shows only when a composition is used (so value?.type is undefined) -->
      <SchemaPropertyDetail v-if="value?.nullable === true">
        nullable
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="value?.writeOnly"
      class="property-write-only">
      write-only
    </div>
    <div
      v-else-if="value?.readOnly"
      class="property-read-only">
      read-only
    </div>
    <div
      v-if="required"
      class="property-required">
      required
    </div>
    <!-- examples -->
    <SchemaPropertyExamples
      v-if="withExamples"
      :examples="value?.examples"
      :example="value?.example || value?.items?.example" />
  </div>
</template>
<style scoped>
.property-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  row-gap: 9px;
  white-space: nowrap;
}

.property-heading:has(+ .children),
.property-heading:has(+ .property-rule) {
  margin-bottom: 9px;
}

.property-heading > * {
  margin-right: 9px;
}

.property-heading:last-child {
  margin-right: 0;
}

.property-heading > .property-detail:not(:last-of-type) {
  margin-right: 0;
}

.property-name {
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
  overflow: hidden;
  white-space: normal;
  overflow-wrap: break-word;
}

.property-additional {
  font-family: var(--scalar-font-code);
}

.property-required,
.property-optional {
  color: var(--scalar-color-2);
}

.property-required {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-orange);
}

.property-read-only {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-blue);
}

.property-write-only {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-green);
}

.property-discriminator {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-purple);
}

.property-detail {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-2);
  display: flex;
  align-items: center;

  min-width: 0;
}

.property-const {
  color: var(--scalar-color-1);
}

.deprecated {
  text-decoration: line-through;
}
</style>
