<script lang="ts" setup>
import { isDefined } from '@scalar/helpers/array/is-defined'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  isArraySchema,
  isNumberSchema,
  isStringSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, toRef } from 'vue'

import { Badge } from '@/components/Badge'
import LinkButton from '@/components/Content/Schema/LinkButton.vue'
import ScreenReader from '@/components/ScreenReader.vue'
import { useLocalization } from '@/features/localization'

import { getSchemaType } from './helpers/get-schema-type'
import {
  isModelLinkable,
  type ModelLinkOptions,
} from './helpers/is-model-linkable'
import { getModelNameWithArray } from './helpers/schema-name'
import RenderString from './RenderString.vue'
import SchemaPropertyDefault from './SchemaPropertyDefault.vue'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'
import SchemaPropertyExamples from './SchemaPropertyExamples.vue'
import SchemaPropertyPattern from './SchemaPropertyPattern.vue'
import SchemaTypeSignature from './SchemaTypeSignature.vue'

const props = withDefaults(
  defineProps<{
    value: SchemaObject | undefined
    enum?: boolean
    isDiscriminator?: boolean
    required?: boolean
    additional?: boolean
    withExamples?: boolean
    hideModelNames?: boolean
    /**
     * Config for deciding whether a model name links to the models section. When the section or
     * the referenced model is hidden there is nothing to scroll to, so the name renders as plain text.
     */
    modelLinkOptions?: ModelLinkOptions
    /** When the schema was resolved from a $ref, pass the ref name so it displays as e.g. "Data" instead of "object". */
    modelName?: string | null
    /** Resolved propertyNames schema, used to surface key constraints like `format` for additional properties. */
    propertyNames?: SchemaObject
    eventBus?: WorkspaceEventBus | null
    /**
     * Tree layout: render the type as a token run instead of a single string.
     *
     * The tree layout is the only caller that sets this, so it doubles as this
     * component's layout signal — see `detailMarginClass`, which spaces the
     * detail list differently per layout.
     */
    typeSignature?: boolean
    /**
     * Tree layout: the row's name is a stand-in for keys the caller chooses
     * (`additionalProperties`) or keys matching a regex (`patternProperties`),
     * not a literal property. The heading says so in the signature line, where
     * the tree already describes shapes, instead of styling the name itself.
     */
    keyKind?: 'additional' | 'pattern'
    /**
     * Tree layout: the name of the schema this row loops back to. A cut cycle
     * is a leaf, so the signature line says why it does not expand; the model
     * link beside it already names the schema the loop returns to.
     */
    recursiveTo?: string
  }>(),
  {
    isDiscriminator: false,
    required: false,
    withExamples: true,
    hideModelNames: false,
    eventBus: null,
  },
)
const { translate } = useLocalization()

// Convert to reactive refs for composables
const valueRef = toRef(props, 'value')

const constValue = computed(() => {
  if (!valueRef.value) {
    return undefined
  }

  const schema = valueRef.value

  // Direct const value
  if (schema.const !== undefined) {
    return schema.const
  }

  // Single-item enum acts as const
  if (schema.enum?.length === 1) {
    return schema.enum[0]
  }

  // Check items for const values (for arrays)
  if (isArraySchema(schema) && schema.items) {
    const items = resolve.schema(schema.items)

    if (isDefined(items.const)) {
      return items.const
    }

    if (items.enum?.length === 1) {
      return items.enum[0]
    }
  }

  return undefined
})

type ValidationProperty = {
  key: string
  value: string | number
  prefix?: string
  code?: boolean
  truncate?: boolean
}

/**
 * Constraints that live on a leaf (string or number) schema: length, pattern,
 * format and numeric ranges. Extracted so they can be surfaced for a primitive
 * schema as well as for a primitive array's items, which are not rendered on
 * their own. See https://github.com/scalar/scalar/issues/9690
 */
const getLeafConstraints = (schema: SchemaObject) => {
  const properties: ValidationProperty[] = []

  if (isStringSchema(schema)) {
    if (schema.minLength) {
      properties.push({
        key: 'min-length',
        prefix: `${translate('common.minLength')}: `,
        value: schema.minLength,
      })
    }

    if (schema.maxLength) {
      properties.push({
        key: 'max-length',
        prefix: `${translate('common.maxLength')}: `,
        value: schema.maxLength,
      })
    }

    // pattern is rendered via SchemaPropertyPattern (hover dropdown), skip here
  }

  if ((isStringSchema(schema) || isNumberSchema(schema)) && schema.format) {
    properties.push({
      key: 'format',
      value: schema.format,
      truncate: true,
    })
  }

  if (isNumberSchema(schema)) {
    if (isDefined(schema.exclusiveMinimum)) {
      properties.push({
        key: 'exclusive-minimum',
        prefix: `${translate('common.greaterThan')}: `,
        value: schema.exclusiveMinimum,
      })
    }

    if (isDefined(schema.minimum)) {
      properties.push({
        key: 'minimum',
        prefix: `${translate('common.min')}: `,
        value: schema.minimum,
      })
    }

    if (isDefined(schema.exclusiveMaximum)) {
      properties.push({
        key: 'exclusive-maximum',
        prefix: `${translate('common.lessThan')}: `,
        value: schema.exclusiveMaximum,
      })
    }

    if (isDefined(schema.maximum)) {
      properties.push({
        key: 'maximum',
        prefix: `${translate('common.max')}: `,
        value: schema.maximum,
      })
    }

    if (isDefined(schema.multipleOf)) {
      properties.push({
        key: 'multiple-of',
        prefix: `${translate('common.multipleOf')}: `,
        value: schema.multipleOf,
      })
    }
  }

  return properties
}

const validationProperties = computed(() => {
  if (!valueRef.value) {
    return []
  }

  const schema = valueRef.value
  const properties: ValidationProperty[] = []

  // Array validation properties
  if (isArraySchema(schema)) {
    if (schema.minItems || schema.maxItems) {
      properties.push({
        key: 'array-range',
        value: `${schema.minItems || ''}…${schema.maxItems || ''}`,
      })
    }

    // Unique items
    if (schema.uniqueItems) {
      properties.push({
        key: 'unique-items',
        value: `${translate('common.unique')}!`,
      })
    }
  }

  properties.push(...getLeafConstraints(schema))

  // Primitive array items carry their own constraints (e.g. an array of `uuid`
  // strings) but are not rendered separately, so surface them here.
  if (isArraySchema(schema) && schema.items) {
    properties.push(...getLeafConstraints(resolve.schema(schema.items)))
  }

  return properties
})

/** Link data for navigating to the referenced model in the sidebar. */
const modelLink = computed(() => {
  if (!props.value) {
    return null
  }

  if (props.hideModelNames) {
    return null
  }

  if (props.modelName) {
    return { schemaKey: props.modelName, label: props.modelName }
  }

  return getModelNameWithArray(props.value)
})

/** Whether the model name links to the models section, or renders as plain text. */
const modelLinkable = computed(() =>
  isModelLinkable(modelLink.value?.schemaKey, props.modelLinkOptions ?? {}),
)

/** Check if we should show the type information */
const shouldShowType = computed(() => {
  if (!props.value || !('type' in props.value)) {
    return false
  }

  // Always show type for arrays, even when items have const values
  if (props.value.type === 'array') {
    return true
  }

  // For non-arrays, only show if no const value at the schema level
  return !constValue.value
})

/** Get the display type */
const displayType = computed(() => {
  if (!props.value) {
    return ''
  }
  return getSchemaType(props.value)
})

/**
 * Type and format of the property keys, derived from the propertyNames schema.
 *
 * For a map keyed by UUIDs this renders e.g. "string · uuid" so the key
 * constraints are not lost. Returns undefined when there is nothing to show.
 */
const propertyNamesDetail = computed(() => {
  const schema = props.propertyNames
  if (!schema) {
    return undefined
  }

  const parts = [getSchemaType(schema)]
  if ('format' in schema && typeof schema.format === 'string') {
    parts.push(schema.format)
  }

  const detail = parts.filter(Boolean).join(' · ')
  return detail.length > 0 ? detail : undefined
})

const exampleValue = computed(() => {
  // Treat only `undefined` as "not set" — `null` is a valid example value on a nullable schema.
  if (
    props.value &&
    'example' in props.value &&
    props.value.example !== undefined
  ) {
    return props.value.example
  }

  if (props.value && isArraySchema(props.value)) {
    const itemsSchema = resolve.schema(props.value.items)
    if (
      itemsSchema &&
      'example' in itemsSchema &&
      itemsSchema.example !== undefined
    ) {
      return itemsSchema.example
    }
  }

  return undefined
})

/**
 * The regex `pattern` to surface via the hover dropdown. It lives on a string
 * schema, or on the items of a primitive array (which is not rendered on its
 * own, so its constraints are surfaced on the array heading — see
 * https://github.com/scalar/scalar/issues/9690).
 */
const patternValue = computed(() => {
  const schema = valueRef.value
  if (!schema) {
    return undefined
  }

  if (isStringSchema(schema) && schema.pattern) {
    return schema.pattern
  }

  if (isArraySchema(schema) && schema.items) {
    const items = resolve.schema(schema.items)
    if (isStringSchema(items) && items.pattern) {
      return items.pattern
    }
  }

  return undefined
})

/**
 * Which details in the dotted list drop their right margin, which differs per layout.
 *
 * `typeSignature` is set by the tree layout alone, so it doubles as this component's
 * layout signal.
 *
 * The tree wants `:has(+.property-detail)`: only a detail FOLLOWED BY another detail
 * drops its margin, because the `·` separator supplies the gap there. The tree also
 * renders spans the legacy layout never does — the collapsed preview and the trailing
 * copy-link — and `:not(:last-of-type)` matches by element type, so it would strip the
 * margin from the final detail and glue "Addressrequired" together on a collapsed row.
 *
 * The legacy layout keeps `:not(:last-of-type)`, the selector it has always had, so its
 * spacing stays exactly as it renders today.
 */
const detailMarginClass = computed((): string =>
  props.typeSignature
    ? '[&>.property-detail:has(+.property-detail)]:mr-0'
    : '[&>.property-detail:not(:last-of-type)]:mr-0',
)
</script>
<template>
  <div
    class="property-heading"
    :class="detailMarginClass">
    <div
      v-if="$slots.name"
      class="property-name"
      :class="{ deprecated: props.value?.deprecated }">
      <slot name="name" />
    </div>
    <div
      v-if="props.isDiscriminator"
      class="property-discriminator">
      {{ translate('common.discriminator') }}
    </div>
    <template v-if="props.value">
      <!-- A map key reads `additionalProperty · string`: the keyword leads the
           detail list in the accent colour, like a type word, so the name
           above it can look like every other name. Tree only: the legacy
           layout marks these on the name instead. -->
      <SchemaPropertyDetail
        v-if="props.keyKind && props.typeSignature"
        class="property-key-kind">
        <span class="font-code text-c-accent">{{
          props.keyKind === 'pattern' ? 'patternProperty' : 'additionalProperty'
        }}</span>
      </SchemaPropertyDetail>
      <!-- Type information -->
      <SchemaPropertyDetail
        v-if="shouldShowType"
        truncate>
        <!-- Tree layout: the type is a token run (`array of Planet`) and a $ref
             link IS the type, not an appended `· Account` -->
        <template v-if="props.typeSignature">
          <!-- Written across lines on purpose: Vue drops whitespace-only text
               between two elements, so a single-line label would read
               `Type:string`. The legacy branch below is followed by an
               interpolation, which keeps its space either way. -->
          <ScreenReader> {{ translate('common.type') }}: </ScreenReader>
          <LinkButton
            v-if="props.eventBus && modelLink?.schemaKey && modelLinkable"
            @click="
              props.eventBus.emit('scroll-to:model-by-name', {
                name: modelLink.schemaKey,
              })
            ">
            <SchemaTypeSignature
              :hideModelNames="props.hideModelNames"
              :modelName="modelLink.label"
              :schema="props.value" />
          </LinkButton>
          <SchemaTypeSignature
            v-else
            :hideModelNames="props.hideModelNames"
            :modelName="modelLink?.label"
            :schema="props.value" />
        </template>
        <template v-else>
          <ScreenReader>{{ translate('common.type') }}:</ScreenReader>
          {{ displayType }}
          <template v-if="modelLink">
            ·
            <LinkButton
              v-if="props.eventBus && modelLink.schemaKey && modelLinkable"
              @click="
                props.eventBus.emit('scroll-to:model-by-name', {
                  name: modelLink.schemaKey,
                })
              ">
              {{ modelLink.label }}
            </LinkButton>
            <template v-else>{{ modelLink.label }}</template>
          </template>
        </template>
      </SchemaPropertyDetail>

      <!-- A cycle reads `array of Satellite · recursive`, a modifier like
           `nullable`; the full sentence rides the tooltip. Tree only. -->
      <SchemaPropertyDetail
        v-if="props.recursiveTo && props.typeSignature"
        class="property-recursive"
        :title="
          translate('schema.recursiveReference', { name: props.recursiveTo })
        ">
        {{ translate('common.recursive') }}
      </SchemaPropertyDetail>

      <!-- Key constraints from propertyNames (e.g. "keys: string · uuid") -->
      <SchemaPropertyDetail
        v-if="propertyNamesDetail"
        truncate>
        <template #prefix>{{ translate('common.keys') }}:</template>
        {{ propertyNamesDetail }}
      </SchemaPropertyDetail>

      <!-- Dynamic validation properties from composable -->
      <SchemaPropertyDetail
        v-for="property in validationProperties"
        :key="property.key"
        :code="property.code"
        :truncate="property.truncate">
        <ScreenReader v-if="property.key === 'format'">
          {{ translate('common.format') }}:
        </ScreenReader>
        <template
          v-if="property.prefix"
          #prefix>
          {{ property.prefix }}
        </template>
        {{ property.value }}
      </SchemaPropertyDetail>

      <!-- Enum indicator -->
      <SchemaPropertyDetail v-if="props.enum">
        {{ translate('common.enum') }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="props.additional"
      class="property-additional">
      <template v-if="props.value?.['x-additionalPropertiesName']">
        {{ props.value['x-additionalPropertiesName'] }}
      </template>
      <template v-else>{{ translate('common.additionalProperties') }}</template>
    </div>
    <div
      v-if="props.value?.deprecated"
      class="property-deprecated">
      <Badge>{{ translate('common.deprecated') }}</Badge>
    </div>
    <!-- Don't use `isDefined` here, we want to show `const` when the value is `null` -->
    <div
      v-if="constValue !== undefined"
      class="property-const">
      <SchemaPropertyDetail truncate>
        <template #prefix>{{ translate('common.const') }}: </template>
        <RenderString :value="constValue" />
      </SchemaPropertyDetail>
    </div>
    <template v-else>
      <!-- Shows only when a composition is used (so props.value?.type is undefined) -->
      <SchemaPropertyDetail v-if="(props.value as any)?.nullable === true">
        {{ translate('common.nullable') }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="props.value?.writeOnly"
      class="property-write-only">
      {{ translate('common.writeOnly') }}
    </div>
    <div
      v-else-if="props.value?.readOnly"
      class="property-read-only">
      {{ translate('common.readOnly') }}
    </div>
    <div
      v-if="props.required"
      class="property-required">
      {{ translate('common.required') }}
    </div>
    <SchemaPropertyDefault :value="props.value?.default" />
    <!--
      Pattern is a hover dropdown chip like Examples, not an inline constraint,
      so it sits beside the example. This keeps the real constraints (length,
      nullable, …) together in the dotted list. See #9966.
    -->
    <SchemaPropertyPattern
      v-if="patternValue"
      :pattern="patternValue" />
    <SchemaPropertyExamples
      v-if="props.withExamples"
      :example="exampleValue"
      :examples="props.value?.examples" />
    <!-- Tree layout: the collapsed preview rides the end of the heading line -->
    <slot name="preview" />
    <!-- Last so the tab order matches the visual order: the trailing copy-link
         is painted at the row's right edge, after every control to its left -->
    <slot name="trailing" />
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

.property-name {
  max-width: 100%;
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-font-size-4);
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
  font-size: var(--scalar-mini);
  color: var(--scalar-color-orange);
}

.property-read-only {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-blue);
}

.property-write-only {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-green);
}

.property-discriminator {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-purple);
}

.property-detail {
  font-size: var(--scalar-mini);
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
