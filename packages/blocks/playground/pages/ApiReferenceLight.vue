<script setup lang="ts">
import { ScalarTeleportRoot } from '@scalar/components/teleport'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, onMounted, ref } from 'vue'

import { CodeExample, generateClientOptions } from '../../src/code-example'

/** The Scalar Galaxy example document, served straight from the registry. */
const GALAXY_URL =
  'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json'

type Endpoint = {
  path: string
  method: HttpMethodType
  operation: OperationObject
  summary: string
  description: string
}

/**
 * Minimal shape of the navigation tree the store attaches at `x-scalar-navigation`.
 * We only care about operation entries and their children for ordering.
 */
type NavigationEntry = {
  type: string
  path?: string
  method?: HttpMethodType
  children?: NavigationEntry[]
}

/**
 * Walk the navigation tree depth-first and collect operations in the exact order
 * the sidebar would render them (tag order, operation sorter, x-scalar-order, …).
 */
const collectOperations = (
  entries: NavigationEntry[] = [],
): Array<{ path: string; method: HttpMethodType }> =>
  entries.flatMap((entry) => [
    ...(entry.type === 'operation' && entry.path && entry.method
      ? [{ path: entry.path, method: entry.method }]
      : []),
    ...collectOperations(entry.children),
  ])

// Only shell/curl is offered, so the client picker collapses to a single option.
const clientOptions = generateClientOptions(['shell/curl'])
const eventBus = createWorkspaceEventBus()

const title = ref('')
const servers = ref<ServerObject[]>([])
const endpoints = ref<Endpoint[]>([])

/** Use the first server from the document to build the example requests. */
const selectedServer = computed<ServerObject | null>(
  () => servers.value[0] ?? null,
)

onMounted(async () => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'galaxy',
    url: GALAXY_URL,
  })

  const document = store.workspace.activeDocument
  if (!document || !('paths' in document)) {
    return
  }

  title.value = document.info?.title ?? 'API Reference'
  servers.value = document.servers ?? []

  // The store builds the sidebar navigation and attaches it to the document, so we
  // reuse its order here instead of iterating the raw `paths` object.
  const navigation = (
    document as unknown as {
      'x-scalar-navigation'?: { children?: NavigationEntry[] }
    }
  )['x-scalar-navigation']

  endpoints.value = collectOperations(navigation?.children).flatMap(
    ({ path, method }) => {
      const pathItem = getResolvedRef(document.paths?.[path])
      const operation = getResolvedRef(pathItem?.[method])
      if (!operation) {
        return []
      }

      return [
        {
          path,
          method,
          operation,
          summary: operation.summary ?? `${method.toUpperCase()} ${path}`,
          description: operation.description ?? '',
        },
      ]
    },
  )
})
</script>

<template>
  <div class="scalar-app light-mode reference">
    <ScalarTeleportRoot>
      <h1 class="reference-title">{{ title }}</h1>

      <section
        v-for="endpoint in endpoints"
        :key="`${endpoint.method}-${endpoint.path}`"
        class="operation">
        <h2 class="operation-summary">{{ endpoint.summary }}</h2>
        <p
          v-if="endpoint.description"
          class="operation-description">
          {{ endpoint.description }}
        </p>
        <CodeExample
          :clientOptions="clientOptions"
          :eventBus="eventBus"
          :method="endpoint.method"
          :operation="endpoint.operation"
          :path="endpoint.path"
          selectedClient="shell/curl"
          :selectedServer="selectedServer"
          :securitySchemes="[]">
          <template #header>
            <span class="operation-path">{{ endpoint.path }}</span>
          </template>
        </CodeExample>
      </section>
    </ScalarTeleportRoot>
  </div>
</template>

<style scoped>
.reference {
  max-width: 48rem;
  margin: 0 auto;
}

.reference-title {
  font-size: var(--scalar-font-size-1);
  font-weight: var(--scalar-bold);
  color: var(--scalar-color-1);
  margin-bottom: 2rem;
}

.operation {
  margin-bottom: 3rem;
}

.operation-summary {
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  margin-bottom: 0.5rem;
}

/* Render the path inside the code example header, matching the standalone block. */
.operation-path {
  min-width: 0;
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-2);
}

.operation-description {
  color: var(--scalar-color-2);
  margin-top: 0;
  margin-bottom: 1rem;
  line-height: 1.3;
  white-space: pre-wrap;
}
</style>
