<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarComboboxOption,
} from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import CommandActionInput from '@/v2/features/command-palette/components/CommandActionInput.vue'
import { getOperationFromCurl } from '@/v2/features/command-palette/helpers/get-operation-from-curl'

const { workspaceStore, curl, eventBus } = defineProps<{
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
  curl: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const exampleKey = ref('')
const exampleKeyTrimmed = computed(() => exampleKey.value.trim())

const { path, method, operation } = getOperationFromCurl(curl)

const documents = computed(() =>
  Object.keys(workspaceStore.workspace.documents).map((document) => ({
    id: document,
    label: document,
  })),
)

const selectedDocument = ref<ScalarComboboxOption | undefined>(
  documents.value[0],
)

const isDisabled = computed(() => {
  if (!exampleKey.value.trim()) {
    return true
  }

  if (!selectedDocument.value) {
    return true
  }

  // Disable if there is a conflict within the document
  const document = workspaceStore.workspace.documents[selectedDocument.value.id]
  if (document?.paths?.[path]?.[method]) {
    return true
  }

  return false
})

const handleImportClick = () => {
  const documentName = selectedDocument.value

  if (!isDisabled.value || !documentName) {
    return
  }

  const result = getOperationFromCurl(curl, exampleKeyTrimmed.value)

  // Create the new operation
  eventBus.emit('operation:create:operation', {
    documentName: documentName.id,
    path: result.path,
    method: result.method,
    operation: result.operation,
    exampleKey: exampleKeyTrimmed.value,
  })

  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="isDisabled"
    @submit="handleImportClick">
    <CommandActionInput
      :modelValue="exampleKey"
      placeholder="Curl example key (e.g., example-1)"
      @update:modelValue="(event) => (exampleKey = event)" />
    <div
      class="flex flex-1 flex-col gap-2"
      @update:modelValue="exampleKey = $event">
      <div
        class="flex h-9 flex-row items-center gap-2 rounded border p-[3px] text-sm">
        <div class="flex h-full">
          <HttpMethod
            :isEditable="false"
            isSquare
            :method="method" />
        </div>
        <span class="scroll-timeline-x whitespace-nowrap">
          <!-- Url + path from the parsed curl -->
          {{ operation.servers?.[0]?.url || '' }}{{ path }}
        </span>
      </div>
    </div>
    <template #options>
      <div class="flex items-center gap-2">
        <ScalarListbox
          v-model="selectedDocument"
          :options="documents">
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <span
              class="whitespace-nowrap"
              :class="selectedDocument ? 'text-c-1' : 'text-c-3'">
              {{
                selectedDocument ? selectedDocument.label : 'Select Collection'
              }}
            </span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
      </div>
    </template>

    <template #submit>
      <span @click="handleImportClick">Import Request</span>
    </template>
  </CommandActionForm>
</template>
<style scoped>
.scroll-timeline-x {
  overflow: auto;
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none;
}
</style>
