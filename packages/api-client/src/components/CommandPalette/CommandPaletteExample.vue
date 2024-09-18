<script setup lang="ts">
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const props = defineProps<{
  /** The request uid to pre-select */
  metaData?: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()
const {
  activeRequest,
  activeWorkspace,
  activeWorkspaceRequests,
  requests,
  requestExampleMutators,
} = useWorkspace()
const { toast } = useToasts()

const exampleName = ref('')
const selectedRequest = ref(
  // Ensure we pre-select the correct request
  requests[props.metaData ?? ''] ?? activeRequest.value,
)

/** Select request in dropdown */
const handleSelect = (request: Request) => (selectedRequest.value = request)

/** Add a new request example */
const handleSubmit = () => {
  if (!exampleName.value) {
    toast('Please enter a name before creating an example.', 'error')
    return
  }
  const example = requestExampleMutators.add(
    selectedRequest.value,
    exampleName.value,
  )
  if (!example) return

  // Route to new request example
  push(
    `/workspace/${activeWorkspace.value.uid}/request/${selectedRequest.value.uid}/examples/${example.uid}`,
  )
  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!exampleName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="exampleName"
      label="Example Name"
      placeholder="Example Name" />
    <template #options>
      <ScalarDropdown
        placement="bottom"
        resize>
        <ScalarButton
          class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
          variant="outlined"
          @click="handleSelect(selectedRequest)">
          {{ selectedRequest.summary }}
          <div class="flex items-center gap-2">
            <HttpMethod :method="selectedRequest.method" />
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="xs" />
          </div>
        </ScalarButton>
        <template #items>
          <div class="max-h-40 custom-scroll">
            <ScalarDropdownItem
              v-for="uid in activeWorkspaceRequests"
              :key="uid"
              class="flex h-7 w-full items-center justify-between px-1 pr-[26px]"
              @click="handleSelect(requests[uid])">
              {{ requests[uid].summary }}
              <HttpMethod :method="requests[uid].method" />
            </ScalarDropdownItem>
          </div>
        </template>
      </ScalarDropdown>
    </template>
    <template #submit>Create Example</template>
  </CommandActionForm>
</template>
