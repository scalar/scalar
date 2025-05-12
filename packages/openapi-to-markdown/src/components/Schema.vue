<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  schema: OpenAPIV3_1.SchemaObject
}>()

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
  <section v-if="schema">
    <!-- Composition keywords -->
    <template v-if="schema.allOf">
      <section>
        <header>
          <strong>All of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in schema.allOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="schema.anyOf">
      <section>
        <header>
          <strong>Any of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in schema.anyOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="schema.oneOf">
      <section>
        <header>
          <strong>One of:</strong>
        </header>
        <section
          v-for="(subSchema, index) in schema.oneOf"
          :key="index">
          <Schema :schema="subSchema" />
        </section>
      </section>
    </template>

    <template v-else-if="schema.not">
      <section>
        <header>
          <strong>Not:</strong>
        </header>
        <section>
          <Schema :schema="schema.not" />
        </section>
      </section>
    </template>

    <!-- Object type -->
    <template v-else-if="schema.type === 'object' || schema.properties">
      <section>
        <ul>
          <template
            v-for="(propSchema, propName) in sortProperties(
              schema.properties || {},
              schema.required,
            )"
            :key="propName">
            <li>
              <strong>
                <code>{{ propName }}</code>
                <span v-if="schema.required?.includes(propName)">
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
    <template v-else-if="schema.type === 'array' && schema.items">
      <section>
        <header>
          <strong>Array of:</strong>
        </header>
        <section>
          <Schema :schema="schema.items" />
        </section>
        <ul
          v-if="
            schema.minItems !== undefined ||
            schema.maxItems !== undefined ||
            schema.uniqueItems
          ">
          <li v-if="schema.minItems !== undefined">
            Min items: <code>{{ schema.minItems }}</code>
          </li>
          <li v-if="schema.maxItems !== undefined">
            Max items: <code>{{ schema.maxItems }}</code>
          </li>
          <li v-if="schema.uniqueItems">Unique items: <code>true</code></li>
        </ul>
      </section>
    </template>

    <!-- Primitive types -->
    <template v-else>
      <section>
        <p>
          <code>{{ schema.type }}</code>
          <template v-if="schema.format">
            <span
              >, format: <code>{{ schema.format }}</code></span
            >
          </template>
          <template v-if="schema.enum">
            <span
              >, possible values:
              <code>{{
                (schema.enum as unknown[])
                  .map((e: unknown) => JSON.stringify(e))
                  .join(', ')
              }}</code>
            </span>
          </template>
          <template v-if="schema.default !== undefined">
            <span
              >, default:
              <code>{{ JSON.stringify(schema.default) }}</code></span
            >
          </template>
          <template v-if="schema.description">
            <span> — {{ schema.description }}</span>
          </template>
        </p>
      </section>
    </template>
  </section>
</template>
