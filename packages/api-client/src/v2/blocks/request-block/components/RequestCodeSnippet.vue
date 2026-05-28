<script setup lang="ts">
import {
  findClient,
  generateCodeSnippet,
  getClients,
  getCustomCodeSamples,
  getSecrets,
  type ClientOption,
  type CustomClientOption,
  type OperationCodeSampleProps,
} from '@scalar/blocks/operation-code-sample'
import { ScalarButton } from '@scalar/components/button'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarCombobox } from '@scalar/components/combobox'
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, watch } from 'vue'

import { DataTable, DataTableRow } from '@/v2/components/data-table'
import { CollapsibleSection } from '@/v2/components/layout'

const {
  clientOptions,
  eventBus,
  operation,
  method,
  path,
  selectedContentType,
  selectedServer = null,
  selectedExample,
  securitySchemes,
  selectedClient,
  globalCookies,
  integration,
} = defineProps<OperationCodeSampleProps & { eventBus: WorkspaceEventBus }>()

/** Grab any custom code samples from the operation */
const customCodeSamples = computed(() => getCustomCodeSamples(operation))

/** Merge custom code samples with the client options */
const clients = computed(() =>
  getClients(
    customCodeSamples.value.samples,
    clientOptions,
    customCodeSamples.value.label,
  ),
)

/**
 * The locally selected client which would include code samples from this operation only
 * Must be local state because it contains custom code samples from this operation only
 */
const localSelectedClient = ref<ClientOption | CustomClientOption | undefined>(
  findClient(clients.value, selectedClient),
)

/**
 * Re-resolve the local client whenever the global selection or the available
 * clients change. Watching `clients` matters when navigating between operations:
 * the stored id stays the same, but the matching option (e.g. a custom sample)
 * differs per operation, so without this the snippet could go stale.
 */
watch([() => selectedClient, clients], ([newClient]) => {
  const client = findClient(clients.value, newClient)
  if (client) {
    localSelectedClient.value = client
  }
})

/** Block secrets from being shown in the code block */
const secretCredentials = computed(() => getSecrets(securitySchemes ?? []))

/** Handle client change */
const handleClientChange = (option: ClientOption | undefined) => {
  localSelectedClient.value = option

  // Sync the selection globally (built-in client or custom sample keyed by language)
  if (option) {
    eventBus.emit('workspace:update:selected-client', option.id)
  }
}

/** Generate the code snippet for the selected example */
const generatedCode = computed<string>(() =>
  generateCodeSnippet({
    defaultDisabledParameters: true,
    clientId: localSelectedClient.value?.id,
    customCodeSamples: customCodeSamples.value.samples,
    operation,
    method,
    path,
    contentType: selectedContentType,
    server: selectedServer,
    securitySchemes,
    example: selectedExample,
    globalCookies,
    includeDefaultHeaders: integration === 'client',
  }),
)

/** Check if there are any clients available (built-in or custom code samples) */
const hasClients = computed(() =>
  clients.value.some((group) => group.options.length > 0),
)
</script>

<template>
  <CollapsibleSection
    v-show="hasClients"
    class="group/preview w-full border-t"
    :defaultOpen="false">
    <template #title>Code Snippet</template>

    <!-- Client selector -->
    <template #actions>
      <div class="flex flex-1">
        <ScalarCombobox
          :modelValue="localSelectedClient"
          :options="clients"
          placement="bottom-end"
          @update:modelValue="
            (ev) => handleClientChange(ev as ClientOption | undefined)
          ">
          <template #default="{ open }">
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-0.5 py-0 text-base font-normal"
              data-testid="client-picker"
              variant="ghost">
              {{ localSelectedClient?.title }}
              <ScalarIconCaretDown
                class="mt-0.25 size-3 transition-transform duration-100"
                :class="open && 'rotate-180'"
                weight="bold" />
            </ScalarButton>
          </template>
        </ScalarCombobox>
      </div>
    </template>

    <!-- Code snippet -->
    <ScalarErrorBoundary>
      <DataTable
        :columns="['']"
        presentational>
        <DataTableRow>
          <div class="overflow-hidden">
            <ScalarCodeBlock
              class="text-base"
              :content="generatedCode"
              :hideCredentials="secretCredentials"
              :lang="localSelectedClient?.lang ?? 'plaintext'"
              lineNumbers />
          </div>
        </DataTableRow>
      </DataTable>
    </ScalarErrorBoundary>
  </CollapsibleSection>
</template>
