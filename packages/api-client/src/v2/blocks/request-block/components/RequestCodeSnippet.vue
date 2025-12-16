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
} from '@/v2/blocks/operation-code-sample'
import type { OperationCodeSampleProps } from '@/v2/blocks/operation-code-sample/components/OperationCodeSample.vue'
import { generateCode } from '@/v2/blocks/operation-code-sample/helpers/generate-code'
import { getClients } from '@/v2/blocks/operation-code-sample/helpers/get-clients'
import { getCustomCodeSamples } from '@/v2/blocks/operation-code-sample/helpers/get-custom-code-keys'
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
  selectedServer,
  selectedExample,
  securitySchemes = [],
  selectedClient,
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
const localSelectedClient = ref<ClientOption | undefined>(
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
const secretCredentials = computed(() => getSecrets(securitySchemes))

/** Handle client change */
const handleClientChange = (option: ClientOption) => {
  localSelectedClient.value = option

  // Emit the change if it's not a custom example
  if (!option.id.startsWith('custom')) {
    eventBus.emit('workspace:update:selected-client', option.id)
  }
}

/** Generate the code snippet for the selected example */
const generatedCode = computed<string>(() =>
  generateCode({
    clientId: localSelectedClient.value?.id,
    customCodeSamples: customCodeSamples.value,
    operation,
    method,
    path,
    contentType: selectedContentType,
    server: selectedServer,
    securitySchemes,
    example: selectedExample,
  }),
)
</script>

<template>
  <ScalarErrorBoundary>
    <div class="w-full">
      <CollapsibleSection
        class="group/preview w-full border-b-0"
        :defaultOpen="false">
        <template #title>Code Snippet</template>

        <!-- Client selector -->
        <template #actions>
          <div class="flex flex-1">
            <ScalarCombobox
              :modelValue="selectedPlugin"
              :options="snippets.options"
              placement="bottom-end"
              @update:modelValue="handleClientChange">
              <ScalarButton
                class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-1.25 py-0.75 font-normal"
                variant="ghost">
                <span>{{ selectedPlugin?.label }}</span>
                <ScalarIconCaretDown
                  class="text-c-2 ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100"
                  weight="bold" />
              </ScalarButton>
            </ScalarCombobox>
          </div>
        </template>

        <!-- Code snippet -->
        <DataTable
          :columns="['']"
          presentational>
          <DataTableRow>
            <div
              class="bg-b-1 flex items-center justify-center overflow-hidden border-t">
              <ScalarCodeBlock
                class="bg-b-2 -outline-offset-2"
                :content="generatedCode"
                :hideCredentials="secretCredentials"
                :lang="localSelectedClient?.lang ?? 'plaintext'"
                lineNumbers />
            </div>
          </DataTableRow>
        </DataTable>
      </CollapsibleSection>
    </div>
  </ScalarErrorBoundary>
</template>
