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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

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

/** Autofocus input */
const exampleInput = ref<HTMLInputElement | null>(null)
onMounted(() => exampleInput.value?.focus())

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

onMounted(() => exampleInput.value?.focus())
</script>
<template>
  <div class="flex w-full flex-col gap-3">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="examplename"></label>
      <input
        id="examplename"
        ref="exampleInput"
        v-model="exampleName"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        label="Example Name"
        placeholder="Example Name"
        @keydown.prevent.enter="handleSubmit" />
    </div>
    <div class="flex gap-2">
      <div class="flex flex-1 max-h-8">
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
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        :disabled="!exampleName.trim()"
        @click="handleSubmit">
        Create Example
      </ScalarButton>
    </div>
  </div>
</template>
