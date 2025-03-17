<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const props = defineProps<{
  /** The request uid to pre-select */
  metaData?: { itemUid: string }
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { push } = useRouter()
const { activeRequest, activeWorkspace, activeWorkspaceRequests } =
  useActiveEntities()
const { requests, requestExampleMutators } = useWorkspace()
const { toast } = useToasts()

const exampleName = ref('')
const selectedRequest = ref<Request | undefined>(
  // Ensure we pre-select the correct request
  requests[props.metaData?.itemUid ?? ''] ?? activeRequest.value,
)

/** Select request in dropdown */
const handleSelect = (request: Request) => (selectedRequest.value = request)

/** Add a new request example */
const handleSubmit = () => {
  if (!exampleName.value) {
    toast('Please enter a name before creating an example.', 'error')
    return
  }

  if (!selectedRequest.value) {
    toast('Please select a request before creating an example.', 'error')
    return
  }

  const example = requestExampleMutators.add(
    selectedRequest.value,
    exampleName.value,
  )

  if (!example) {
    return
  }

  // Go to new request example
  push({
    name: 'request.examples',
    params: {
      [PathId.Workspace]: activeWorkspace.value?.uid,
      [PathId.Request]: selectedRequest.value.uid,
      [PathId.Examples]: example.uid,
    },
  })

  emits('close')
}

/** Requests for the active workspace */
const visibleRequests = computed<Request[]>(() =>
  activeWorkspaceRequests.value.map((uid) => requests?.[uid]).filter(isDefined),
)
</script>
<template>
  <CommandActionForm
    v-if="selectedRequest"
    :disabled="!exampleName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="exampleName"
      label="Example Name"
      placeholder="Example Name"
      @onDelete="emits('back', $event)" />
    <template #options>
      <ScalarDropdown
        placement="bottom"
        resize>
        <ScalarButton
          class="hover:bg-b-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
          variant="outlined"
          @click="handleSelect(selectedRequest)">
          {{ selectedRequest.summary }}
          <div class="flex items-center gap-2">
            <HttpMethod :method="selectedRequest.method" />
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </div>
        </ScalarButton>
        <template #items>
          <div class="custom-scroll max-h-40">
            <ScalarDropdownItem
              v-for="request in visibleRequests"
              :key="request.uid"
              class="flex h-7 w-full items-center justify-between px-1 pr-[26px]"
              @click="handleSelect(request)">
              {{ request.summary }}
              <HttpMethod :method="request.method" />
            </ScalarDropdownItem>
          </div>
        </template>
      </ScalarDropdown>
    </template>
    <template #submit>Create Example</template>
  </CommandActionForm>
</template>
