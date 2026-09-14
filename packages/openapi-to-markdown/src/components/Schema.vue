<script setup lang="ts">
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MaybeRefSchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'

const {
  schema,
  depth = 0,
  hideDescription = false,
  ancestors = [],
} = defineProps<{
  schema: MarkdownSchema
  depth?: number
  hideDescription?: boolean
  ancestors?: readonly unknown[]
}>()

// A depth guard bounds pathological inputs without mislabeling them as cycles.
const MAX_DEPTH = 64

type MarkdownSchema = MaybeRefSchemaObject | boolean

type ResolvedSchema = Record<string, unknown> | boolean

const resolveNestedSchema = (
  value: MarkdownSchema | undefined,
): ResolvedSchema | undefined => {
  const resolved = getResolvedRef<unknown>(value)
  if (typeof resolved === 'boolean') return resolved
  if (resolved && typeof resolved === 'object') {
    return getResolvedRef(
      value as MaybeRefSchemaObject,
      mergeSiblingReferences,
    ) as Record<string, unknown>
  }
  return undefined
}

// Use original resolved identities: merging siblings creates fresh objects.
const identity = getResolvedRef<unknown>(schema)
const circular =
  typeof identity === 'object' &&
  identity !== null &&
  ancestors.includes(identity)
const childAncestors = [...ancestors, identity]
const resolvedSchema = resolveNestedSchema(schema)

const asObject = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined

const getSchemaType = (
  value: ResolvedSchema | undefined,
): string | string[] | undefined => {
  const schemaType = asObject(value)?.type
  if (typeof schemaType === 'string') {
    return schemaType
  }
  if (
    Array.isArray(schemaType) &&
    schemaType.every((entry) => typeof entry === 'string')
  ) {
    return schemaType
  }
  return undefined
}

const getSchemaArray = (
  value: ResolvedSchema | undefined,
  key: 'allOf' | 'anyOf' | 'oneOf',
): MarkdownSchema[] | undefined => {
  const collection = asObject(value)?.[key]
  if (!Array.isArray(collection)) {
    return undefined
  }
  return collection.filter(
    (entry): entry is MarkdownSchema =>
      typeof entry === 'boolean' ||
      (entry !== null && typeof entry === 'object'),
  )
}

const getSchemaNot = (
  value: ResolvedSchema | undefined,
): MarkdownSchema | undefined => {
  const notSchema = asObject(value)?.not
  return typeof notSchema === 'boolean' ||
    (notSchema !== null && typeof notSchema === 'object')
    ? (notSchema as MarkdownSchema)
    : undefined
}

const getSchemaProperties = (
  value: ResolvedSchema | undefined,
): Record<string, MarkdownSchema> => {
  const properties = asObject(value)?.properties
  if (!properties || typeof properties !== 'object') {
    return {}
  }
  return Object.entries(properties).reduce<Record<string, MarkdownSchema>>(
    (acc, [name, prop]) => {
      if (
        typeof prop === 'boolean' ||
        (prop !== null && typeof prop === 'object')
      ) {
        acc[name] = prop as MarkdownSchema
      }
      return acc
    },
    {},
  )
}

const getSchemaRequired = (value: ResolvedSchema | undefined): string[] => {
  const required = asObject(value)?.required
  if (!Array.isArray(required)) {
    return []
  }
  return required.filter((item): item is string => typeof item === 'string')
}

const getSchemaItems = (
  value: ResolvedSchema | undefined,
): MarkdownSchema | undefined => {
  const items = asObject(value)?.items
  return typeof items === 'boolean' ||
    (items !== null && typeof items === 'object')
    ? (items as MarkdownSchema)
    : undefined
}

const getSchemaFormat = (
  value: ResolvedSchema | undefined,
): string | undefined =>
  typeof asObject(value)?.format === 'string'
    ? (asObject(value)?.format as string)
    : undefined

const getSchemaEnum = (
  value: ResolvedSchema | undefined,
): unknown[] | undefined => {
  const enumValues = asObject(value)?.enum
  return Array.isArray(enumValues) ? enumValues : undefined
}

const getSchemaDefault = (value: ResolvedSchema | undefined): unknown =>
  asObject(value)?.default

const getSchemaConst = (value: ResolvedSchema | undefined): unknown =>
  asObject(value)?.const

const getSchemaDescription = (
  value: ResolvedSchema | undefined,
): string | undefined =>
  typeof asObject(value)?.description === 'string'
    ? (asObject(value)?.description as string)
    : undefined

const getSchemaMinItems = (
  value: ResolvedSchema | undefined,
): number | undefined =>
  typeof asObject(value)?.minItems === 'number'
    ? (asObject(value)?.minItems as number)
    : undefined

const getSchemaMaxItems = (
  value: ResolvedSchema | undefined,
): number | undefined =>
  typeof asObject(value)?.maxItems === 'number'
    ? (asObject(value)?.maxItems as number)
    : undefined

const getSchemaUniqueItems = (
  value: ResolvedSchema | undefined,
): boolean | undefined =>
  typeof asObject(value)?.uniqueItems === 'boolean'
    ? (asObject(value)?.uniqueItems as boolean)
    : undefined

const getResolvedSchemaType = (value: MarkdownSchema | undefined) =>
  getSchemaType(resolveNestedSchema(value))
const getResolvedSchemaFormat = (value: MarkdownSchema | undefined) =>
  getSchemaFormat(resolveNestedSchema(value))
const getResolvedSchemaEnum = (value: MarkdownSchema | undefined) =>
  getSchemaEnum(resolveNestedSchema(value))
const getResolvedSchemaDefault = (value: MarkdownSchema | undefined) =>
  getSchemaDefault(resolveNestedSchema(value))
const getResolvedSchemaConst = (value: MarkdownSchema | undefined): unknown =>
  getSchemaConst(resolveNestedSchema(value))
const getResolvedSchemaDescription = (value: MarkdownSchema | undefined) =>
  getSchemaDescription(resolveNestedSchema(value))
const getResolvedSchemaProperties = (value: MarkdownSchema | undefined) =>
  getSchemaProperties(resolveNestedSchema(value))
const getResolvedSchemaItems = (value: MarkdownSchema | undefined) =>
  getSchemaItems(resolveNestedSchema(value))

const hasComposition = (value: MarkdownSchema | undefined): boolean => {
  const resolved = resolveNestedSchema(value)
  return Boolean(
    getSchemaArray(resolved, 'allOf') ||
    getSchemaArray(resolved, 'anyOf') ||
    getSchemaArray(resolved, 'oneOf') ||
    getSchemaNot(resolved) !== undefined,
  )
}

const getConstraints = (
  value: MarkdownSchema | undefined,
): { name: string; value: string | number }[] => {
  const resolved = asObject(resolveNestedSchema(value))
  return [
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'minLength',
    'maxLength',
    'pattern',
  ].flatMap((name) => {
    const constraint = resolved?.[name]
    return typeof constraint === 'number' || typeof constraint === 'string'
      ? [{ name, value: constraint }]
      : []
  })
}

const getAccess = (value: MarkdownSchema): string => {
  const resolved = asObject(resolveNestedSchema(value))
  return [
    resolved?.readOnly === true ? 'readOnly' : '',
    resolved?.writeOnly === true ? 'writeOnly' : '',
  ]
    .filter(Boolean)
    .join(', ')
}

const getAdditionalProperties = (
  value: ResolvedSchema | undefined,
): MarkdownSchema | undefined => {
  const additional = asObject(value)?.additionalProperties
  return typeof additional === 'boolean' ||
    (additional !== null && typeof additional === 'object')
    ? (additional as MarkdownSchema)
    : undefined
}

const discriminator = asObject(asObject(resolvedSchema)?.discriminator)
const discriminatorMappings = asObject(discriminator?.mapping)

const formatSchemaType = (value: MarkdownSchema | undefined): string => {
  const resolved = resolveNestedSchema(value)
  if (resolved === true) return 'any (true schema)'
  if (resolved === false) return 'never (false schema)'
  const schemaType = getResolvedSchemaType(value)
  if (
    !schemaType &&
    resolved &&
    typeof resolved === 'object' &&
    Object.keys(resolved).length === 0
  )
    return 'any'
  return Array.isArray(schemaType)
    ? schemaType.join(' | ')
    : schemaType ||
        (Object.keys(getResolvedSchemaProperties(value)).length ? 'object' : '')
}

const formatEnumValues = (value: unknown[] | undefined): string =>
  value?.map((entry: unknown) => JSON.stringify(entry)).join(', ') || ''

// Sort properties to show required fields first, then optional, then metadata
const sortProperties = (
  properties: Record<string, MarkdownSchema>,
  required?: string[],
) => {
  const sorted = Object.entries(properties).sort(([a], [b]) => {
    const aRequired = required?.includes(a)
    const bRequired = required?.includes(b)
    if (aRequired && !bRequired) return -1
    if (!aRequired && bRequired) return 1
    return a.localeCompare(b)
  })
  return Object.fromEntries(sorted)
}
</script>

<template>
  <section v-if="circular">
    <p><em>[Circular Reference]</em></p>
  </section>
  <section v-else-if="depth >= MAX_DEPTH">
    <p><em>[Maximum schema depth reached]</em></p>
  </section>
  <section v-else-if="typeof resolvedSchema === 'boolean'">
    <p>
      <code>{{ formatSchemaType(schema) }}</code>
    </p>
  </section>
  <section v-else-if="resolvedSchema">
    <section v-if="getAdditionalProperties(resolvedSchema) !== undefined">
      <p>
        <strong>Additional properties:</strong
        ><template
          v-if="typeof getAdditionalProperties(resolvedSchema) === 'boolean'">
          <code>{{ getAdditionalProperties(resolvedSchema) }}</code>
        </template>
      </p>
      <Schema
        v-if="typeof getAdditionalProperties(resolvedSchema) === 'object'"
        :ancestors="childAncestors"
        :depth="depth + 1"
        :schema="getAdditionalProperties(resolvedSchema)!" />
    </section>
    <section v-if="discriminator">
      <p>
        <strong>Discriminator:</strong>
        <code>{{ discriminator.propertyName }}</code>
      </p>
      <ul v-if="discriminatorMappings">
        <li
          v-for="(target, name) in discriminatorMappings"
          :key="name">
          <code>{{ name }}</code
          >: <code>{{ target }}</code>
        </li>
      </ul>
    </section>
    <ul v-if="getConstraints(schema).length">
      <li
        v-for="constraint in getConstraints(schema)"
        :key="constraint.name">
        {{ constraint.name }}: <code>{{ constraint.value }}</code>
      </li>
    </ul>
    <p v-if="getAccess(schema)">
      <strong>Access:</strong> {{ getAccess(schema) }}
    </p>
    <!-- Composition keywords -->
    <template v-if="getSchemaArray(resolvedSchema, 'allOf')">
      <section>
        <header>
          <strong>All of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in getSchemaArray(resolvedSchema, 'allOf')"
          :key="index">
          <Schema
            :ancestors="childAncestors"
            :depth="depth + 1"
            :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-if="getSchemaArray(resolvedSchema, 'anyOf')">
      <section>
        <header>
          <strong>Any of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in getSchemaArray(resolvedSchema, 'anyOf')"
          :key="index">
          <Schema
            :ancestors="childAncestors"
            :depth="depth + 1"
            :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-if="getSchemaArray(resolvedSchema, 'oneOf')">
      <section>
        <header>
          <strong>One of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in getSchemaArray(resolvedSchema, 'oneOf')"
          :key="index">
          <Schema
            :ancestors="childAncestors"
            :depth="depth + 1"
            :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-if="getSchemaNot(resolvedSchema) !== undefined">
      <section>
        <header>
          <strong>Not:</strong>
        </header>
        <section>
          <Schema
            :ancestors="childAncestors"
            :depth="depth + 1"
            :schema="getSchemaNot(resolvedSchema)!" />
        </section>
      </section>
    </template>

    <!-- Object type -->
    <template
      v-if="
        getSchemaType(resolvedSchema) === 'object' ||
        Object.keys(getSchemaProperties(resolvedSchema)).length
      ">
      <section>
        <ul>
          <template
            v-for="(propSchema, propName) in sortProperties(
              getSchemaProperties(resolvedSchema),
              getSchemaRequired(resolvedSchema),
            )"
            :key="propName">
            <li>
              <strong>
                <code>{{ propName }}</code>
                <span v-if="getAccess(propSchema)">
                  ({{ getAccess(propSchema) }})</span
                >
                <span
                  v-if="typeof resolveNestedSchema(propSchema) === 'boolean'">
                  ({{ formatSchemaType(propSchema) }})</span
                >
                <span
                  v-if="getSchemaRequired(resolvedSchema).includes(propName)">
                  (required)
                </span>
              </strong>
              <p>
                <code>
                  {{ formatSchemaType(propSchema) }}
                </code>
                <template v-if="getResolvedSchemaFormat(propSchema)">
                  <span
                    >, format:
                    <code>{{ getResolvedSchemaFormat(propSchema) }}</code></span
                  >
                </template>
                <template v-if="getResolvedSchemaEnum(propSchema)">
                  <span
                    >, possible values:
                    <code>{{
                      formatEnumValues(getResolvedSchemaEnum(propSchema))
                    }}</code>
                  </span>
                </template>
                <span v-if="getResolvedSchemaConst(propSchema) !== undefined"
                  >, const:
                  <code>{{
                    JSON.stringify(getResolvedSchemaConst(propSchema))
                  }}</code></span
                >
                <template
                  v-if="getResolvedSchemaDefault(propSchema) !== undefined">
                  <span
                    >, default:
                    <code>{{
                      JSON.stringify(getResolvedSchemaDefault(propSchema))
                    }}</code></span
                  >
                </template>
                <template v-if="!hasComposition(propSchema)">
                  <span
                    v-for="constraint in getConstraints(propSchema)"
                    :key="constraint.name">
                    , {{ constraint.name }}: <code>{{ constraint.value }}</code>
                  </span>
                </template>
                <template v-if="getResolvedSchemaDescription(propSchema)">
                  <span> — {{ getResolvedSchemaDescription(propSchema) }}</span>
                </template>
              </p>
              <Schema
                v-if="
                  getResolvedSchemaType(propSchema) === 'object' ||
                  Object.keys(getResolvedSchemaProperties(propSchema)).length ||
                  hasComposition(propSchema) ||
                  getAdditionalProperties(resolveNestedSchema(propSchema)) !==
                    undefined
                "
                :ancestors="childAncestors"
                :depth="depth + 1"
                :schema="propSchema" />
              <template
                v-if="
                  getResolvedSchemaType(propSchema) === 'array' &&
                  getResolvedSchemaItems(propSchema) !== undefined
                ">
                <section>
                  <header>
                    <strong>Items:</strong>
                  </header>
                  <Schema
                    :ancestors="childAncestors"
                    :depth="depth + 1"
                    :schema="getResolvedSchemaItems(propSchema)!" />
                </section>
              </template>
            </li>
          </template>
        </ul>
      </section>
    </template>

    <!-- Array type -->
    <template
      v-else-if="
        getSchemaType(resolvedSchema) === 'array' &&
        getSchemaItems(resolvedSchema) !== undefined
      ">
      <section>
        <header>
          <strong>Array of:</strong>
        </header>
        <section>
          <Schema
            :ancestors="childAncestors"
            :depth="depth + 1"
            :schema="getSchemaItems(resolvedSchema)!" />
        </section>
        <ul
          v-if="
            getSchemaMinItems(resolvedSchema) !== undefined ||
            getSchemaMaxItems(resolvedSchema) !== undefined ||
            getSchemaUniqueItems(resolvedSchema)
          ">
          <li v-if="getSchemaMinItems(resolvedSchema) !== undefined">
            Min items: <code>{{ getSchemaMinItems(resolvedSchema) }}</code>
          </li>
          <li v-if="getSchemaMaxItems(resolvedSchema) !== undefined">
            Max items: <code>{{ getSchemaMaxItems(resolvedSchema) }}</code>
          </li>
          <li v-if="getSchemaUniqueItems(resolvedSchema)">
            Unique items: <code>true</code>
          </li>
        </ul>
      </section>
    </template>

    <!-- Primitive types -->
    <template
      v-else-if="!hasComposition(schema) || getSchemaType(resolvedSchema)">
      <section>
        <p>
          <code>{{ getSchemaType(resolvedSchema) }}</code>
          <template v-if="getSchemaFormat(resolvedSchema)">
            <span
              >, format:
              <code>{{ getSchemaFormat(resolvedSchema) }}</code></span
            >
          </template>
          <template v-if="getSchemaEnum(resolvedSchema)">
            <span
              >, possible values:
              <code>{{ formatEnumValues(getSchemaEnum(resolvedSchema)) }}</code>
            </span>
          </template>
          <span v-if="getSchemaConst(resolvedSchema) !== undefined"
            >, const:
            <code>{{
              JSON.stringify(getSchemaConst(resolvedSchema))
            }}</code></span
          >
          <template v-if="getSchemaDefault(resolvedSchema) !== undefined">
            <span
              >, default:
              <code>{{
                JSON.stringify(getSchemaDefault(resolvedSchema))
              }}</code></span
            >
          </template>
          <template
            v-if="!hideDescription && getSchemaDescription(resolvedSchema)">
            <span> — {{ getSchemaDescription(resolvedSchema) }}</span>
          </template>
        </p>
      </section>
    </template>
  </section>
</template>
