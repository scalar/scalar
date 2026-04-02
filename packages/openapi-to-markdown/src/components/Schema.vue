<script setup lang="ts">
import { resolve } from '@scalar/workspace-store/resolve'
import type { MaybeRefSchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

const { schema } = defineProps<{
  schema: MaybeRefSchemaObject
}>()

type ResolvedSchema = NonNullable<
  ReturnType<typeof resolve.schema<MaybeRefSchemaObject>>
>

const resolvedSchema = resolve.schema(schema)

const resolveNestedSchema = (
  value: MaybeRefSchemaObject | undefined,
): ResolvedSchema | undefined => resolve.schema(value)

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
): MaybeRefSchemaObject[] | undefined => {
  const collection = asObject(value)?.[key]
  if (!Array.isArray(collection)) {
    return undefined
  }
  return collection.filter(
    (entry): entry is MaybeRefSchemaObject =>
      entry !== null && typeof entry === 'object',
  )
}

const getSchemaNot = (
  value: ResolvedSchema | undefined,
): MaybeRefSchemaObject | undefined => {
  const notSchema = asObject(value)?.not
  return notSchema !== null && typeof notSchema === 'object'
    ? (notSchema as MaybeRefSchemaObject)
    : undefined
}

const getSchemaProperties = (
  value: ResolvedSchema | undefined,
): Record<string, MaybeRefSchemaObject> => {
  const properties = asObject(value)?.properties
  if (!properties || typeof properties !== 'object') {
    return {}
  }
  return Object.entries(properties).reduce<
    Record<string, MaybeRefSchemaObject>
  >((acc, [name, prop]) => {
    if (prop !== null && typeof prop === 'object') {
      acc[name] = prop as MaybeRefSchemaObject
    }
    return acc
  }, {})
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
): MaybeRefSchemaObject | undefined => {
  const items = asObject(value)?.items
  return items !== null && typeof items === 'object'
    ? (items as MaybeRefSchemaObject)
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

const getResolvedSchemaType = (value: MaybeRefSchemaObject | undefined) =>
  getSchemaType(resolveNestedSchema(value))
const getResolvedSchemaFormat = (value: MaybeRefSchemaObject | undefined) =>
  getSchemaFormat(resolveNestedSchema(value))
const getResolvedSchemaEnum = (value: MaybeRefSchemaObject | undefined) =>
  getSchemaEnum(resolveNestedSchema(value))
const getResolvedSchemaDefault = (value: MaybeRefSchemaObject | undefined) =>
  getSchemaDefault(resolveNestedSchema(value))
const getResolvedSchemaDescription = (
  value: MaybeRefSchemaObject | undefined,
) => getSchemaDescription(resolveNestedSchema(value))
const getResolvedSchemaProperties = (value: MaybeRefSchemaObject | undefined) =>
  getSchemaProperties(resolveNestedSchema(value))
const getResolvedSchemaItems = (value: MaybeRefSchemaObject | undefined) =>
  getSchemaItems(resolveNestedSchema(value))

const formatSchemaType = (value: MaybeRefSchemaObject | undefined): string => {
  const schemaType = getResolvedSchemaType(value)
  return Array.isArray(schemaType)
    ? schemaType.join(' | ')
    : schemaType || 'object'
}

const formatEnumValues = (value: unknown[] | undefined): string =>
  value?.map((entry: unknown) => JSON.stringify(entry)).join(', ') || ''

// Sort properties to show required fields first, then optional, then metadata
const sortProperties = (
  properties: Record<string, MaybeRefSchemaObject>,
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
  <section v-if="resolvedSchema">
    <!-- Composition keywords -->
    <template v-if="getSchemaArray(resolvedSchema, 'allOf')">
      <section>
        <header>
          <strong>All of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in getSchemaArray(resolvedSchema, 'allOf')"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="getSchemaArray(resolvedSchema, 'anyOf')">
      <section>
        <header>
          <strong>Any of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in getSchemaArray(resolvedSchema, 'anyOf')"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="getSchemaArray(resolvedSchema, 'oneOf')">
      <section>
        <header>
          <strong>One of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in getSchemaArray(resolvedSchema, 'oneOf')"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="getSchemaNot(resolvedSchema)">
      <section>
        <header>
          <strong>Not:</strong>
        </header>
        <section>
          <Schema :schema="getSchemaNot(resolvedSchema)!" />
        </section>
      </section>
    </template>

    <!-- Object type -->
    <template
      v-else-if="
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
                <template
                  v-if="getResolvedSchemaDefault(propSchema) !== undefined">
                  <span
                    >, default:
                    <code>{{
                      JSON.stringify(getResolvedSchemaDefault(propSchema))
                    }}</code></span
                  >
                </template>
                <template v-if="getResolvedSchemaDescription(propSchema)">
                  <span> — {{ getResolvedSchemaDescription(propSchema) }}</span>
                </template>
              </p>
              <Schema
                v-if="
                  getResolvedSchemaType(propSchema) === 'object' ||
                  Object.keys(getResolvedSchemaProperties(propSchema)).length
                "
                :schema="propSchema" />
              <template
                v-if="
                  getResolvedSchemaType(propSchema) === 'array' &&
                  getResolvedSchemaItems(propSchema)
                ">
                <section>
                  <header>
                    <strong>Items:</strong>
                  </header>
                  <Schema :schema="getResolvedSchemaItems(propSchema)!" />
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
        getSchemaItems(resolvedSchema)
      ">
      <section>
        <header>
          <strong>Array of:</strong>
        </header>
        <section>
          <Schema :schema="getSchemaItems(resolvedSchema)!" />
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
    <template v-else>
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
          <template v-if="getSchemaDefault(resolvedSchema) !== undefined">
            <span
              >, default:
              <code>{{
                JSON.stringify(getSchemaDefault(resolvedSchema))
              }}</code></span
            >
          </template>
          <template v-if="getSchemaDescription(resolvedSchema)">
            <span> — {{ getSchemaDescription(resolvedSchema) }}</span>
          </template>
        </p>
      </section>
    </template>
  </section>
</template>
