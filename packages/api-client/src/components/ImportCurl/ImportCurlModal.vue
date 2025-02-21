<script setup lang="ts">
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  type ScalarComboboxOption,
  ScalarIcon,
  ScalarListbox,
  ScalarModal,
  ScalarTextField,
} from '@scalar/components'
import type {
  RequestMethod,
  RequestPayload,
} from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  parsedCurl: RequestPayload | null
  state: { open: boolean; show: () => void; hide: () => void }
  collectionUid: string
}>()

const emits = defineEmits<{
  (
    event: 'importCurl',
    payload: {
      parsedCurl: RequestPayload
      requestName: string
      collectionUid: string
    },
  ): void
  (event: 'close'): void
}>()

const { toast } = useToasts()
const requestName = ref('')
const { activeWorkspaceCollections, activeCollection } = useActiveEntities()
const isRequestNameEmpty = computed(() => !requestName.value.trim())

const collections = computed(() =>
  activeWorkspaceCollections.value.map((collection) => ({
    id: collection.uid,
    label: collection.info?.title ?? 'Unititled Collection',
  })),
)

const selectedCollection = ref<ScalarComboboxOption | undefined>(
  props.collectionUid
    ? collections.value.find(
        (collection) => collection.id === props.collectionUid,
      )
    : collections.value.find(
        (collection) => collection.id === activeCollection.value?.uid,
      ),
)

function handleImportClick() {
  if (isRequestNameEmpty.value) {
    toast('Please enter a name before importing your request.', 'error')
    return
  }
  importRequest()
}

function importRequest() {
  if (props.parsedCurl) {
    emits('importCurl', {
      parsedCurl: props.parsedCurl,
      requestName: requestName.value,
      collectionUid: selectedCollection.value?.id ?? '',
    })
  }
}

// Reset request name input when modal gets opened
watch(
  () => props.state.open,
  (isOpen) => {
    if (isOpen) {
      requestName.value = ''
    }
  },
)
</script>
<template>
  <ScalarModal
    size="xs"
    :state="state"
    title="Import cURL request">
    <ScalarTextField
      v-model="requestName"
      autofocus
      class="h-9"
      placeholder="Request Name"
      @keyup.enter="handleImportClick" />
    <div
      class="border flex flex-row gap-2 h-9 items-center mb-4 mt-2 p-[3px] rounded text-sm">
      <div class="flex h-full">
        <HttpMethod
          :isEditable="false"
          isSquare
          :method="(props.parsedCurl?.method as RequestMethod) || 'get'" />
      </div>
      <span class="scroll-timeline-x whitespace-nowrap">
        {{ props.parsedCurl?.servers?.[0] || ''
        }}{{ props.parsedCurl?.path || '' }}
      </span>
    </div>
    <div class="flex gap-10 justify-between">
      <ScalarListbox
        v-model="selectedCollection"
        :options="collections">
        <ScalarButton
          class="justify-between p-2 max-h-8 gap-1 text-xs hover:bg-b-2"
          variant="outlined">
          <span
            class="whitespace-nowrap"
            :class="selectedCollection ? 'text-c-1' : 'text-c-3'"
            >{{
              selectedCollection
                ? selectedCollection.label
                : 'Select Collection'
            }}</span
          >
          <ScalarIcon
            class="text-c-3"
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
      </ScalarListbox>
      <ScalarButton
        class="gap-1.5 font-medium px-2.5 h-8 shadow-none focus:outline-none whitespace-nowrap"
        :disabled="isRequestNameEmpty"
        type="submit"
        @click="handleImportClick">
        Import Request
      </ScalarButton>
    </div>
  </ScalarModal>
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
