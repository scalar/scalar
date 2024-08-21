<script setup lang="ts">
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { RequestMethod } from '@scalar/oas-utils/helpers'
import { useToasts } from '@scalar/use-toasts'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()
const { toast } = useToasts()

const {
  activeCollection,
  activeWorkspace,
  activeWorkspaceCollections,
  requestMutators,
  activeRequest,
  folders: _folders,
} = useWorkspace()

const requestName = ref('')
const requestMethod = ref('GET')
const selectedCollectionId = ref(activeCollection.value?.uid ?? '')

const collections = computed(() =>
  activeWorkspaceCollections.value.map((collection) => ({
    id: collection.uid,
    label: collection.spec.info?.title ?? 'Unititled Collection',
  })),
)

const selectedCollection = computed({
  get: () =>
    collections.value.find(({ id }) => id === selectedCollectionId.value),
  set: (opt) => {
    if (opt?.id) selectedCollectionId.value = opt.id
  },
})

/** All folders in active workspace */
const folders = computed(() =>
  activeWorkspaceCollections.value.flatMap((collection) =>
    collection.uid === selectedCollectionId.value
      ? collection.childUids.flatMap((uid) => {
          // Check if child of collection is folder as it could be a request
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
      : [],
  ),
)
const selectedFolderId = ref(
  Object.values(_folders).find((folder) =>
    folder.childUids.includes(activeRequest.value?.uid),
  )?.uid ?? '',
)

const selectedFolder = computed({
  get: () => folders.value.find(({ id }) => id === selectedFolderId.value),
  set: (opt) => {
    if (opt?.id) selectedFolderId.value = opt.id
  },
})

function handleChangeMethod(method: string) {
  requestMethod.value = method
}

const handleSubmit = () => {
  if (!requestName.value.trim()) {
    toast('Please enter a name before creating a request.', 'error')
    return
  }
  if (!selectedCollectionId.value && !selectedFolder.value?.id) return
  const parentUid = selectedFolder.value?.id ?? selectedCollection.value?.id

  const newRequest = requestMutators.add(
    {
      path: '',
      method: requestMethod.value.toUpperCase() as RequestMethod,
      description: requestName.value,
      operationId: requestName.value,
      summary: requestName.value,
      tags: ['default'],
    },
    parentUid,
  )

  push(`/workspace/${activeWorkspace.value.uid}/request/${newRequest.uid}`)
  emits('close')
}

const requestInput = ref<HTMLInputElement | null>(null)
onMounted(() => {
  requestInput.value?.focus()
})
</script>
<template>
  <div class="flex w-full flex-col gap-3">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="requestname"></label>
      <input
        id="requestname"
        ref="requestInput"
        v-model="requestName"
        autocomplete="off"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        data-form-type="other"
        data-lpignore="true"
        label="Request Name"
        placeholder="Request Name"
        @keydown.prevent.enter="handleSubmit" />
    </div>
    <div class="flex">
      <div class="flex flex-1 gap-2 max-h-8">
        <HttpMethod
          :isEditable="true"
          isSquare
          :method="requestMethod"
          @change="handleChangeMethod" />
        <ScalarListbox
          v-model="selectedCollection"
          :options="collections">
          <ScalarButton
            class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
            variant="outlined">
            <span :class="selectedCollection ? 'text-c-1' : 'text-c-3'">{{
              selectedCollection
                ? selectedCollection.label
                : 'Select Collection'
            }}</span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="xs" />
          </ScalarButton>
        </ScalarListbox>
        <ScalarListbox
          v-if="folders.length"
          v-model="selectedFolder"
          :options="folders">
          <ScalarButton
            class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
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
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        :disabled="!requestName.trim()"
        @click="handleSubmit">
        Create Request
      </ScalarButton>
    </div>
  </div>
</template>
