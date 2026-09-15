<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { LinkObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

const { links } = defineProps<{ links?: Record<string, unknown> }>()
const entries = computed(() =>
  Object.entries(links ?? {}).flatMap(([name, reference]) => {
    const link = getResolvedRef(reference as LinkObject)
    return isObject(link) ? [{ name, link }] : []
  }),
)
const formatValue = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)
</script>

<template>
  <section v-if="entries.length">
    <p><strong>Links:</strong></p>
    <ul>
      <li
        v-for="{ name, link } in entries"
        :key="name">
        <p>
          <strong>{{ name }}</strong>
        </p>
        <ScalarMarkdown
          v-if="link.description"
          :value="link.description" />
        <p v-if="link.operationId">
          <strong>Operation ID:</strong> <code>{{ link.operationId }}</code>
        </p>
        <p v-if="link.operationRef">
          <strong>Operation reference:</strong>
          <code>{{ link.operationRef }}</code>
        </p>
        <ul v-if="link.parameters">
          <li
            v-for="(value, parameter) in link.parameters"
            :key="parameter">
            <strong>{{ parameter }}:</strong>
            <code>{{ formatValue(value) }}</code>
          </li>
        </ul>
        <p v-if="link.requestBody !== undefined">
          <strong>Request body:</strong>
          <code>{{ formatValue(link.requestBody) }}</code>
        </p>
        <p v-if="link.server">
          <strong>Server:</strong> <code>{{ link.server.url }}</code>
        </p>
      </li>
    </ul>
  </section>
</template>
