<script setup lang="ts">
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarCombobox,
  ScalarErrorBoundary,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, watch } from 'vue'

import {
  findClient,
  type ClientOption,
  type CustomClientOption,
} from '@/v2/blocks/operation-code-sample'
import type { OperationCodeSampleProps } from '@/v2/blocks/operation-code-sample/components/OperationCodeSample.vue'
import { generateCodeSnippet } from '@/v2/blocks/operation-code-sample/helpers/generate-code-snippet'
import { getClients } from '@/v2/blocks/operation-code-sample/helpers/get-clients'
import { getCustomCodeSamples } from '@/v2/blocks/operation-code-sample/helpers/get-custom-code-samples'
import { getSecrets } from '@/v2/blocks/operation-code-sample/helpers/get-secrets'
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
  getClients(customCodeSamples.value, clientOptions),
)

/**
 * The locally selected client which would include code samples from this operation only
 * Must be local state because it contains custom code samples from this operation only
 */
const localSelectedClient = ref<ClientOption | CustomClientOption | undefined>(
  findClient(clients.value, selectedClient),
)

/** If the globally selected client changes we can update the local one */
watch(
  () => selectedClient,
  (newClient) => {
    const client = findClient(clients.value, newClient)
    if (client) {
      localSelectedClient.value = client
    }
  },
)

/** Block secrets from being shown in the code block */
const secretCredentials = computed(() => getSecrets(securitySchemes ?? []))

/** Handle client change */
const handleClientChange = (option: ClientOption | undefined) => {
  localSelectedClient.value = option

  // Emit the change if it's not a custom example
  if (option && !option.id.startsWith('custom')) {
    eventBus.emit('workspace:update:selected-client', option.id)
  }
}

/** Generate the code snippet for the selected example */
const generatedCode = computed<string>(() =>
  generateCodeSnippet({
    clientId: localSelectedClient.value?.id,
    customCodeSamples: customCodeSamples.value,
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
