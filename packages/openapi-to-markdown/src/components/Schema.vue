<script setup lang="ts">
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

const { schema } = defineProps<{
  schema: SchemaObject
}>()

const resolvedSchema = resolve.schema(schema as never) as
  | Record<string, any>
  | undefined

// Sort properties to show required fields first, then optional, then metadata
const sortProperties = (
  properties: Record<string, any>,
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
    <template v-if="resolvedSchema.allOf">
      <section>
        <header>
          <strong>All of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in resolvedSchema.allOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="resolvedSchema.anyOf">
      <section>
        <header>
          <strong>Any of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in resolvedSchema.anyOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="resolvedSchema.oneOf">
      <section>
        <header>
          <strong>One of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in resolvedSchema.oneOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="resolvedSchema.not">
      <section>
        <header>
          <strong>Not:</strong>
        </header>
        <section>
          <Schema :schema="resolvedSchema.not" />
        </section>
      </section>
    </template>

    <!-- Object type -->
    <template
      v-else-if="resolvedSchema.type === 'object' || resolvedSchema.properties">
      <section>
        <ul>
          <template
            v-for="(propSchema, propName) in sortProperties(
              resolvedSchema.properties || {},
              resolvedSchema.required,
            )"
            :key="propName">
            <li>
              <strong>
                <code>{{ propName }}</code>
                <span v-if="resolvedSchema.required?.includes(propName)">
                  (required)
                </span>
              </strong>
              <p>
                <code>
                  {{
                    Array.isArray(propSchema.type)
                      ? propSchema.type.join(' | ')
                      : propSchema.type || 'object'
                  }}
                </code>
                <template v-if="propSchema.format">
                  <span
                    >, format: <code>{{ propSchema.format }}</code></span
                  >
                </template>
                <template v-if="propSchema.enum">
                  <span
                    >, possible values:
                    <code>{{
                      (propSchema.enum as unknown[])
                        .map((e: unknown) => JSON.stringify(e))
                        .join(', ')
                    }}</code>
                  </span>
                </template>
                <template v-if="propSchema.default !== undefined">
                  <span
                    >, default:
                    <code>{{ JSON.stringify(propSchema.default) }}</code></span
                  >
                </template>
                <template v-if="propSchema.description">
                  <span> — {{ propSchema.description }}</span>
                </template>
              </p>
              <Schema
                v-if="propSchema.type === 'object' || propSchema.properties"
                :schema="propSchema" />
              <template v-if="propSchema.type === 'array' && propSchema.items">
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
    <template
      v-else-if="resolvedSchema.type === 'array' && resolvedSchema.items">
      <section>
        <header>
          <strong>Array of:</strong>
        </header>
        <section>
          <Schema :schema="resolvedSchema.items" />
        </section>
        <ul
          v-if="
            resolvedSchema.minItems !== undefined ||
            resolvedSchema.maxItems !== undefined ||
            resolvedSchema.uniqueItems
          ">
          <li v-if="resolvedSchema.minItems !== undefined">
            Min items: <code>{{ resolvedSchema.minItems }}</code>
          </li>
          <li v-if="resolvedSchema.maxItems !== undefined">
            Max items: <code>{{ resolvedSchema.maxItems }}</code>
          </li>
          <li v-if="resolvedSchema.uniqueItems">
            Unique items: <code>true</code>
          </li>
        </ul>
      </section>
    </template>

    <!-- Primitive types -->
    <template v-else>
      <section>
        <p>
          <code>{{ resolvedSchema.type }}</code>
          <template v-if="resolvedSchema.format">
            <span
              >, format: <code>{{ resolvedSchema.format }}</code></span
            >
          </template>
          <template v-if="resolvedSchema.enum">
            <span
              >, possible values:
              <code>{{
                (resolvedSchema.enum as unknown[])
                  .map((e: unknown) => JSON.stringify(e))
                  .join(', ')
              }}</code>
            </span>
          </template>
          <template v-if="resolvedSchema.default !== undefined">
            <span
              >, default:
              <code>{{ JSON.stringify(resolvedSchema.default) }}</code></span
            >
          </template>
          <template v-if="resolvedSchema.description">
            <span> — {{ resolvedSchema.description }}</span>
          </template>
        </p>
      </section>
    </template>
  </section>
</template>
