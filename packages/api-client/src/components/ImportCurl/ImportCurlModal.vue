<script setup lang="ts">
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { ScalarButton, ScalarModal, ScalarTextField } from '@scalar/components'
import type {
  RequestMethod,
  RequestPayload,
} from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  parsedCurl: RequestPayload | null
  state: { open: boolean; show: () => void; hide: () => void }
}>()

const emits = defineEmits<{
  (
    event: 'importCurl',
    payload: { parsedCurl: RequestPayload; requestName: string },
  ): void
  (event: 'close'): void
}>()

const { toast } = useToasts()
const requestName = ref('')

const isRequestNameEmpty = computed(() => !requestName.value.trim())

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
      placeholder="Request Name"
      @keyup.enter="handleImportClick" />
    <div
      class="border flex flex-row gap-2 h-10 items-center my-4 p-[3px] rounded text-sm">
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
      <ScalarButton
        class="gap-1.5 px-2.5 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
        type="button"
        variant="outlined"
        @click="emits('close')">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="gap-1.5 font-medium px-2.5 h-8 shadow-none focus:outline-none"
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
