<script lang="ts">
type SelectorProps = {
  /** The event bus to use for emitting events */
  eventBus: WorkspaceEventBus
  /** The currently selected server */
  selectedServer: AsyncApiServerEntry | null
  /** Available servers */
  servers: AsyncApiServerEntry[]
  options?: Partial<AsyncApiSchemaRenderOptions>
}

/**
 * AsyncApiServerSelector
 *
 * Core component for rendering an AsyncAPI server selector block. It mirrors the
 * OpenAPI ServerSelector, but works with the AsyncAPI server shape (a named map
 * of `host`/`protocol`/`pathname` rather than an array of `url`).
 *
 * @event asyncapi-server:update:selected - Emitted when the selected server changes
 * @event asyncapi-server:update:variables - Emitted when a server variable changes
 */
export default {}
</script>

<script lang="ts" setup>
import { ServerVariablesForm } from '@scalar/api-client/components/Server'
import { SchemaPropertyExamples } from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import type { ServerVariableObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed, useId } from 'vue'

import AsyncApiDocumentation from '@/components/Content/AsyncApi/AsyncApiDocumentation.vue'
import Bindings from '@/components/Content/AsyncApi/Bindings.vue'
import type { AsyncApiSchemaRenderOptions } from '@/components/Content/AsyncApi/helpers/async-api-render-options'
import { getBindingEntries } from '@/components/Content/AsyncApi/helpers/get-binding-entries'
import { SpecificationExtension } from '@/features/specification-extension'
import { useSpecificationExtensions } from '@/features/specification-extension/use-specification-extensions'
import { useLocalization } from '@/features/localization'

import Selector from './Selector.vue'

const { eventBus, servers, selectedServer, options } =
  defineProps<SelectorProps>()

const id = useId()
const { translate } = useLocalization()

/**
 * Normalize AsyncAPI server variables into the shape the shared
 * ServerVariablesForm expects (resolving references and defaulting `default`).
 */
const serverVariables = computed(() => {
  const variables = selectedServer?.server.variables
  if (!variables) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(variables).flatMap(
      ([name, variable]): [
        string,
        ServerVariableObject & { examples?: string[] },
      ][] => {
        const resolved = getResolvedAsyncApiRef(variable)
        if (!resolved) return []
        return [
          [
            name,
            {
              default: resolved.default ?? '',
              enum: resolved.enum,
              description: resolved.description,
              ...(resolved.examples?.length
                ? { examples: resolved.examples }
                : {}),
            },
          ],
        ]
      },
    ),
  )
})

/** Only provide hints for authored examples; examples never replace defaults. */
const variableExamples = computed(() =>
  Object.entries(serverVariables.value ?? {}).filter(
    ([, variable]) => variable.examples?.length,
  ),
)

const serverSummary = computed(() => selectedServer?.server.summary?.trim())

const serverProtocolVersion = computed(() => {
  const version = selectedServer?.server.protocolVersion?.trim()
  return version ? `${selectedServer?.protocol.toUpperCase()} ${version}` : ''
})

const { hasExtensions } = useSpecificationExtensions(
  () => selectedServer?.server,
  () => options?.showExtensions,
)

const hasServerDetails = computed(() =>
  Boolean(
    hasExtensions.value ||
    serverSummary.value ||
    serverProtocolVersion.value ||
    selectedServer?.description ||
    getBindingEntries(selectedServer?.server.bindings).length ||
    selectedServer?.server.externalDocs,
  ),
)

/** Update the selected server */
const updateServer = (name: string) => {
  eventBus.emit('asyncapi-server:update:selected', { name })
}

/** Update a server variable on the selected server */
const updateServerVariable = (key: string, value: string) => {
  if (!selectedServer) {
    return
  }

  eventBus.emit('asyncapi-server:update:variables', {
    name: selectedServer.name,
    key,
    value,
  })
}
</script>

<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-xl border-x border-t px-3 py-2.5 font-medium">
    {{ translate('server.label') }}
  </label>
  <div
    :id="id"
    class="border"
    :class="{
      'rounded-b-xl': !hasServerDetails && !serverVariables,
    }">
    <Selector
      v-if="servers.length"
      :selectedServer
      :servers="servers"
      :target="id"
      @update:modelValue="updateServer" />
  </div>
  <ServerVariablesForm
    layout="reference"
    :variables="serverVariables"
    @update:variable="updateServerVariable">
    <template
      v-for="[name, variable] in variableExamples"
      :key="name"
      #[`hint-${name}`]>
      <div class="flex">
        <SchemaPropertyExamples
          align="start"
          :examples="variable.examples" />
      </div>
    </template>
  </ServerVariablesForm>

  <div
    v-if="hasServerDetails"
    class="text-c-3 flex flex-col gap-1.5 rounded-b-xl border-x border-b px-3 py-1.5">
    <p
      v-if="serverProtocolVersion"
      class="text-c-2 text-sm">
      {{ serverProtocolVersion }}
    </p>
    <p v-if="serverSummary">{{ serverSummary }}</p>
    <ScalarMarkdown
      v-if="selectedServer?.description"
      :value="selectedServer.description" />
    <Bindings
      :bindings="selectedServer?.server.bindings"
      class="my-2 [&>.bindings-heading]:-mx-3 [&>.bindings-heading]:px-3"
      :options="options"
      scope="server" />
    <AsyncApiDocumentation
      :owner="{ externalDocs: selectedServer?.server.externalDocs }" />
    <SpecificationExtension
      compact
      :showExtensions="options?.showExtensions"
      :value="selectedServer?.server" />
  </div>
</template>
