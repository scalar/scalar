<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarComboboxOption,
} from '@scalar/components'
import { isHttpMethod } from '@scalar/oas-utils/helpers'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const props = defineProps<{
  metaData?: {
    itemUid: string
    parentUid: string
  }
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { push } = useRouter()
const { toast } = useToasts()

const {
  activeCollection,
  activeWorkspace,
  activeWorkspaceCollections,
  activeRequest,
} = useActiveEntities()
const { requestMutators, tags: _tags } = useWorkspace()

const requestName = ref('')
const requestMethod = ref('get')

const collections = computed(() =>
  activeWorkspaceCollections.value.map((collection) => ({
    id: collection.uid,
    label: collection.info?.title ?? 'Unititled Collection',
  })),
)

/** Tags in selected collection */
const tags = computed(() =>
  activeWorkspaceCollections.value.flatMap((collection) =>
    collection.uid === selectedCollection.value?.id
      ? collection.tags.flatMap((uid) => {
          // Check if child of collection is folder as it could be a request
          const tag = _tags[uid]
          return tag
            ? [
                {
                  id: tag.uid,
                  label: tag.name,
                },
              ]
            : []
        })
      : [],
  ),
)

/** Currently selected collection with a reasonable default */
const selectedCollection = ref(
  props.metaData
    ? collections.value.find(
        (collection) =>
          collection.id === props.metaData?.itemUid ||
          collection.id === props.metaData?.parentUid,
      )
    : collections.value.find(
        (collection) => collection.id === activeCollection.value?.uid,
      ),
)

/** Currently selected tag with a reasonable default */
const selectedTag = ref<ScalarComboboxOption | undefined>(
  props.metaData
    ? tags.value.find((tag) => tag.id === props.metaData?.itemUid)
    : tags.value.find((tag) => tag.label === activeRequest.value?.tags?.[0]),
)

const handleChangeMethod = (method: string) => (requestMethod.value = method)

const handleSubmit = () => {
  if (!requestName.value.trim()) {
    toast('Please enter a name before creating a request.', 'error')
    return
  }
  if (!selectedCollection.value?.id || !isHttpMethod(requestMethod.value))
    return

  const newRequest = requestMutators.add(
    {
      path: '',
      method: requestMethod.value,
      description: requestName.value,
      operationId: requestName.value,
      summary: requestName.value,
      tags: selectedTag.value ? [selectedTag.value.label] : [],
    },
    selectedCollection.value.id,
  )

  if (newRequest)
    push({
      name: 'request',
      params: {
        workspace: activeWorkspace.value?.uid,
        request: newRequest.uid,
      },
    })

  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!requestName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="requestName"
      label="Request Name"
      placeholder="Request Name"
      @onDelete="emits('back', $event)" />
    <template #options>
      <div class="flex">
        <HttpMethod
          :isEditable="true"
          isSquare
          :method="requestMethod"
          @change="handleChangeMethod" />
        <ScalarListbox
          v-model="selectedCollection"
          :options="collections">
          <ScalarButton
            class="hover:bg-b-2 ml-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <span
              class="whitespace-nowrap"
              :class="selectedCollection ? 'text-c-1' : 'text-c-3'">
              {{
                selectedCollection
                  ? selectedCollection.label
                  : 'Select Collection'
              }}
            </span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
        <ScalarListbox
          v-if="tags.length"
          v-model="selectedTag"
          :options="tags">
          <ScalarButton
            class="hover:bg-b-2 ml-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <span :class="selectedTag ? 'text-c-1' : 'text-c-3'">
              {{ selectedTag ? selectedTag.label : 'Select Tag' }}
            </span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
      </div>
    </template>
    <template #submit> Create Request </template>
  </CommandActionForm>
</template>
