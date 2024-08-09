<script setup lang="ts">
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { RequestMethod } from '@scalar/oas-utils/helpers'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { handleKeyDown } from './handleKeyDown'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()

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

// we only allow websockets to be added to drafts or non OpenAPI collections
// so we would call it AsyncAPI collections maybe? Graphql/websocket/mqtt/ssr/grpc etc
const collections = computed(() =>
  activeWorkspaceCollections.value
    .filter((collection) => collection.spec.info?.title === 'Drafts')
    .map((collection) => ({
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

const handleSubmit = () => {
  if (!selectedCollectionId.value) return
  const parentUid = selectedCollection.value?.id

  // const newRequest = requestMutators.add(
  //   {
  //     path: '',
  //     method: requestMethod.value.toUpperCase() as RequestMethod,
  //     description: requestName.value,
  //     operationId: requestName.value,
  //     summary: requestName.value,
  //     tags: ['default'],
  //   },
  //   parentUid,
  // )

  // push(`/workspace/${activeWorkspace.value.uid}/request/${newRequest.uid}`)
  push(`/workspace/${activeWorkspace.value.uid}/websocket/default`)
  emits('close')
}

const requestInput = ref<HTMLInputElement | null>(null)
onMounted(() => {
  requestInput.value?.focus()
  window.addEventListener(
    'keydown',
    (event) => handleKeyDown(event, handleSubmit),
    true,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    (event) => handleKeyDown(event, handleSubmit),
    true,
  )
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
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        label="Websocket Name"
        placeholder="Websocket Name" />
    </div>
    <div class="flex">
      <div class="flex flex-1 gap-2 max-h-8">
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
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        @click="handleSubmit">
        Create Request
      </ScalarButton>
    </div>
  </div>
</template>
