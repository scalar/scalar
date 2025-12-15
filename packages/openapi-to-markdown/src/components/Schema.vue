<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { isSchemaObject } from '@scalar/openapi-types/helpers'
import { computed } from 'vue'

const props = defineProps<{
  schema: OpenAPIV3_1.SchemaObject
}>()

/**
 * Computed property that returns the schema if it's an object, or null otherwise.
 * This ensures type narrowing works properly in the template.
 */
const schemaObject = computed(() => {
  return isSchemaObject(props.schema) ? props.schema : null
})

// Sort properties to show required fields first, then optional, then metadata
const sortProperties = (
  properties: Record<string, OpenAPIV3_1.SchemaObject>,
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
  <section v-if="schemaObject">
    <!-- Composition keywords -->
    <template v-if="schemaObject.allOf">
      <section>
        <header>
          <strong>All of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in schemaObject.allOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="schemaObject.anyOf">
      <section>
        <header>
          <strong>Any of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in schemaObject.anyOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="schemaObject.oneOf">
      <section>
        <header>
          <strong>One of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in schemaObject.oneOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="schemaObject.not">
      <section>
        <header>
          <strong>Not:</strong>
        </header>
        <section>
          <Schema :schema="schemaObject.not" />
        </section>
      </section>
    </template>

    <!-- Object type -->
    <template
      v-else-if="schemaObject.type === 'object' || schemaObject.properties">
      <section>
        <ul>
          <template
            v-for="(propSchema, propName) in sortProperties(
              schemaObject.properties || {},
              schemaObject.required,
            )"
            :key="propName">
            <li>
              <strong>
                <code>{{ propName }}</code>
                <span v-if="schemaObject.required?.includes(String(propName))">
                  (required)
                </span>
              </strong>
              <p>
                <code>
                  {{
                    isSchemaObject(propSchema) && Array.isArray(propSchema.type)
                      ? propSchema.type.join(' | ')
                      : isSchemaObject(propSchema) && propSchema.type
                        ? propSchema.type
                        : 'object'
                  }}
                </code>
                <template
                  v-if="isSchemaObject(propSchema) && propSchema.format">
                  <span
                    >, format: <code>{{ propSchema.format }}</code></span
                  >
                </template>
                <template v-if="isSchemaObject(propSchema) && propSchema.enum">
                  <span
                    >, possible values:
                    <code>{{
                      (propSchema.enum as unknown[])
                        .map((e: unknown) => JSON.stringify(e))
                        .join(', ')
                    }}</code>
                  </span>
                </template>
                <template
                  v-if="
                    isSchemaObject(propSchema) &&
                    propSchema.default !== undefined
                  ">
                  <span
                    >, default:
                    <code>{{ JSON.stringify(propSchema.default) }}</code></span
                  >
                </template>
                <template
                  v-if="isSchemaObject(propSchema) && propSchema.description">
                  <span> — {{ propSchema.description }}</span>
                </template>
              </p>
              <Schema
                v-if="
                  isSchemaObject(propSchema) &&
                  (propSchema.type === 'object' || propSchema.properties)
                "
                :schema="propSchema" />
              <template
                v-if="
                  isSchemaObject(propSchema) &&
                  propSchema.type === 'array' &&
                  propSchema.items
                ">
                <section>
                  <header>
                    <strong>Items:</strong>
                  </header>
                  <Schema :schema="propSchema.items" />
                </section>
              </template>
            </li>
          </template>
        </ul>
      </section>
    </template>

    <!-- Array type -->
    <template v-else-if="schemaObject.type === 'array' && schemaObject.items">
      <section>
        <header>
          <strong>Array of:</strong>
        </header>
        <section>
          <Schema :schema="schemaObject.items" />
        </section>
        <ul
          v-if="
            schemaObject.minItems !== undefined ||
            schemaObject.maxItems !== undefined ||
            schemaObject.uniqueItems
          ">
          <li v-if="schemaObject.minItems !== undefined">
            Min items: <code>{{ schemaObject.minItems }}</code>
          </li>
          <li v-if="schemaObject.maxItems !== undefined">
            Max items: <code>{{ schemaObject.maxItems }}</code>
          </li>
          <li v-if="schemaObject.uniqueItems">
            Unique items: <code>true</code>
          </li>
        </ul>
      </section>
    </template>

    <!-- Primitive types -->
    <template v-else>
      <section>
        <p>
          <code>{{ schemaObject.type }}</code>
          <template v-if="schemaObject.format">
            <span
              >, format: <code>{{ schemaObject.format }}</code></span
            >
          </template>
          <template v-if="schemaObject.enum">
            <span
              >, possible values:
              <code>{{
                (schemaObject.enum as unknown[])
                  .map((e: unknown) => JSON.stringify(e))
                  .join(', ')
              }}</code>
            </span>
          </template>
          <template v-if="schemaObject.default !== undefined">
            <span
              >, default:
              <code>{{ JSON.stringify(schemaObject.default) }}</code></span
            >
          </template>
          <template v-if="schemaObject.description">
            <span> — {{ schemaObject.description }}</span>
          </template>
        </p>
      </section>
    </template>
  </section>
</template>
