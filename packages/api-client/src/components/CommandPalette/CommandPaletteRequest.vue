<script setup lang="ts">
import { isHTTPMethod } from '@/components/HttpMethod'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  type ScalarComboboxOption,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  metaData?: {
    itemUid: string
    parentUid: string
  }
}>()

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
  tags: _tags,
} = useWorkspace()

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
const selectedCollection = ref<ScalarComboboxOption | undefined>(
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
  if (!selectedCollection.value?.id || !isHTTPMethod(requestMethod.value))
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
    push(`/workspace/${activeWorkspace.value.uid}/request/${newRequest.uid}`)

  emits('close')
}

const requestInput = ref<HTMLInputElement | null>(null)
nextTick(() => {
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
          v-if="tags.length"
          v-model="selectedTag"
          :options="tags">
          <ScalarButton
            class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
            variant="outlined">
            <span :class="selectedTag ? 'text-c-1' : 'text-c-3'">
              {{ selectedTag ? selectedTag.label : 'Select Tag' }}
            </span>
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
