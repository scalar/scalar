<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  schema: OpenAPIV3_1.SchemaObject
}>()
</script>

<template>
  <section v-if="schema">
    <!-- Object type -->
    <template v-if="schema.type === 'object' || schema.properties">
      <ul>
        <template
          v-for="(propSchema, propName) in schema.properties"
          :key="propName">
          <li>
            <span>
              <code>{{ propName }}</code>
              <span v-if="schema.required?.includes(propName)"
                ><strong> (required)</strong></span
              >:
              <code>
                {{
                  Array.isArray(propSchema.type)
                    ? propSchema.type.join(' | ')
                    : propSchema.type || 'object'
                }}
              </code>
              <span v-if="propSchema.format"
                >, format: <code>{{ propSchema.format }}</code></span
              >
              <span v-if="propSchema.enum"
                >, possible values:
                <code>{{
                  (propSchema.enum as unknown[])
                    .map((e: unknown) => JSON.stringify(e))
                    .join(', ')
                }}</code></span
              >
              <span v-if="propSchema.default !== undefined"
                >, default:
                <code>{{ JSON.stringify(propSchema.default) }}</code></span
              >
              <span v-if="propSchema.description">
                — {{ propSchema.description }}</span
              >
            </span>
            <SchemaRenderer
              v-if="propSchema.type === 'object' || propSchema.properties"
              :schema="propSchema" />
            <template v-if="propSchema.type === 'array' && propSchema.items">
              <ul>
                <li>
                  <strong>Items:</strong>
                  <SchemaRenderer :schema="propSchema.items" />
                </li>
              </ul>
            </template>
          </li>
        </template>
      </ul>
    </template>

    <!-- Array type -->
    <template v-else-if="schema.type === 'array' && schema.items">
      <ul>
        <li>
          <strong>Array of:</strong>
          <SchemaRenderer :schema="schema.items" />
          <ul>
            <li v-if="schema.minItems !== undefined">
              Min items: <code>{{ schema.minItems }}</code>
            </li>
            <li v-if="schema.maxItems !== undefined">
              Max items: <code>{{ schema.maxItems }}</code>
            </li>
            <li v-if="schema.uniqueItems">Unique items: <code>true</code></li>
          </ul>
        </li>
      </ul>
    </template>

    <!-- Primitive types -->
    <template v-else>
      <ul>
        <li>
          <span>
            <code>{{ schema.type }}</code>
            <span v-if="schema.format"
              >, format: <code>{{ schema.format }}</code></span
            >
            <span v-if="schema.enum"
              >, possible values:
              <code>{{
                (schema.enum as unknown[])
                  .map((e: unknown) => JSON.stringify(e))
                  .join(', ')
              }}</code></span
            >
            <span v-if="schema.default !== undefined"
              >, default:
              <code>{{ JSON.stringify(schema.default) }}</code></span
            >
            <span v-if="schema.description"> — {{ schema.description }}</span>
          </span>
        </li>
      </ul>
    </template>
  </section>
</template>
