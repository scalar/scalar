<script setup lang="ts">
import { useWorkspace } from '@/store'
import { ADD_AUTH_OPTIONS } from '@/views/Request/consts/new-auth-options'
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  ScalarModal,
} from '@scalar/components'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  state: { open: boolean; show: () => void; hide: () => void }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', id: string): void
}>()

const { toast } = useToasts()

const newScheme = ref<{ id: string; label: string } | undefined>(undefined)
const newFlow = ref<
  | {
      id: string
      label: string
      payload?: {
        type?: string
        flow?: { type: string }
        in?: string
        scheme?: string
      }
    }
  | undefined
>(undefined)

const { securitySchemeMutators, activeCollection } = useWorkspace()

const authTypes = computed(() =>
  ADD_AUTH_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
  })),
)

const subOptions = computed(() => {
  const selectedType = ADD_AUTH_OPTIONS.find(
    (option) => option.label === newScheme.value?.label,
  )
  return selectedType ? selectedType.options : []
})

const addNewScheme = () => {
  if (!newScheme.value || !newFlow.value) {
    toast('Please select an auth type and option.', 'error')
    return
  }

  const scheme = {
    type: newFlow.value.payload?.type as SecurityScheme['type'],
    nameKey: newFlow.value.label,
    uid: newFlow.value.id,
  } as SecurityScheme

  if (newFlow.value.payload?.type === 'oauth2' && newFlow.value.payload.flow) {
    ;(scheme as SecurityScheme & { flow: { type: string } }).flow = {
      type: newFlow.value.payload.flow.type,
    }
  }

  if (newFlow.value.payload?.type === 'apiKey' && newFlow.value.payload.in) {
    ;(scheme as SecurityScheme & { in: string }).in = newFlow.value.payload.in
  }

  if (newFlow.value.payload?.type === 'http' && newFlow.value.payload.scheme) {
    ;(scheme as SecurityScheme & { scheme: string }).scheme =
      newFlow.value.payload.scheme
  }

  securitySchemeMutators.add(scheme, activeCollection.value?.uid || '')
  emit('submit', scheme.uid)
  emit('close')
}

// Reset second select values when the first select gets changed
watch(newScheme, () => {
  newFlow.value = undefined
})

// Reset select values when it gets closed
watch(
  () => props.state.open,
  (newVal) => {
    if (!newVal) {
      newScheme.value = undefined
      newFlow.value = undefined
    }
  },
)

const setPlaceholder = () => {
  switch (newScheme.value?.id) {
    case 'oauth2':
      return 'Select Flow'
    case 'http':
      return 'Select Type'
    case 'apiKey':
      return 'Select Payload'
    default:
      return null
  }
}
</script>
<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Security Scheme">
    <div class="flex flex-col gap-2">
      <ScalarListbox
        v-model="newScheme"
        :options="authTypes"
        resize>
        <ScalarButton
          class="p-3 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
          variant="outlined">
          <span :class="newScheme ? 'text-c-1' : 'text-c-3'">
            {{ newScheme ? newScheme.label : 'Select Auth Type' }}
          </span>
          <ScalarIcon
            class="ml-auto text-c-3"
            icon="ChevronDown"
            size="xs" />
        </ScalarButton>
      </ScalarListbox>
      <div v-if="newScheme">
        <ScalarListbox
          v-model="newFlow"
          :options="subOptions"
          resize>
          <ScalarButton
            class="p-3 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
            variant="outlined">
            <span :class="newFlow ? 'text-c-1' : 'text-c-3'">
              {{ newFlow ? newFlow.label : setPlaceholder() }}
            </span>
            <ScalarIcon
              class="ml-auto text-c-3"
              icon="ChevronDown"
              size="xs" />
          </ScalarButton>
        </ScalarListbox>
      </div>
      <div class="flex justify-between">
        <ScalarButton
          class="gap-1.5 px-3 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
          type="button"
          variant="outlined"
          @click="emit('close')">
          Cancel
        </ScalarButton>
        <ScalarButton
          class="gap-1.5 px-3 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
          :disabled="!newScheme || !newFlow"
          type="submit"
          @click="addNewScheme">
          Add Security Scheme
        </ScalarButton>
      </div>
    </div>
  </ScalarModal>
</template>
