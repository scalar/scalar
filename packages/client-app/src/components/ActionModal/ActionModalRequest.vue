<script setup lang="ts">
import Request from '@/assets/ascii/request.ascii?raw'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { RequestMethod } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()

const { requestMutators, activeCollection, folders: _folders } = useWorkspace()
const requestName = ref('')
const requestMethod = ref('GET')
const selectedFolderId = ref('')

const folders = computed(() => {
  if (!activeCollection.value) return []

  // Check if child of collection is folder as it could be a request
  return Object.values(activeCollection.value.childUids).flatMap((uid) => {
    const folder = _folders[uid]

    return folder
      ? [
          {
            id: folder.uid,
            label: folder.name,
          },
        ]
      : []
  })
})

const selectedFolder = computed({
  get: () => folders.value.find(({ id }) => id === selectedFolderId.value),
  set: (opt) => {
    if (opt?.id) selectedFolderId.value = opt.id
  },
})

function handleChangeMethod(method: string) {
  requestMethod.value = method
}

function handleSubmit() {
  if (!activeCollection.value) return

  const newRequest = requestMutators.add({
    path: '',
    method: requestMethod.value.toUpperCase() as RequestMethod,
    description: requestName.value,
    operationId: requestName.value,
    summary: requestName.value,
    tags: ['default'],
  })

  push(`/request/${newRequest.uid}`)
  emits('close')
}
</script>
<template>
  <ScalarAsciiArt :art="Request" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <div class="flex min-h-10 gap-3 rounded border p-1">
      <HttpMethod
        :isEditable="true"
        isSquare
        :method="requestMethod"
        @change="handleChangeMethod" />
      <input
        v-model="requestName"
        label="Request Name"
        placeholder="Request Name" />
    </div>
    <div>
      <span class="mb-1 block font-medium">Inside:</span>
      <ScalarListbox
        v-model="selectedFolder"
        :options="folders"
        resize>
        <ScalarButton
          class="justify-between p-2 w-full"
          variant="outlined">
          <span :class="selectedFolder ? 'text-c-1' : 'text-c-3'">{{
            selectedFolder ? selectedFolder.label : 'Select Folder'
          }}</span>
          <ScalarIcon
            class="text-c-3"
            icon="ChevronDown"
            size="xs" />
        </ScalarButton>
      </ScalarListbox>
    </div>
    <ScalarButton type="submit"> Create </ScalarButton>
  </form>
</template>
