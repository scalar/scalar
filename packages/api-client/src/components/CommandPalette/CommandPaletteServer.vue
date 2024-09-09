<script setup lang="ts">
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  type ScalarComboboxOption,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, nextTick, onMounted, ref } from 'vue'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { toast } = useToasts()

const {
  activeCollection,
  activeWorkspaceCollections,
  collectionMutators,
  serverMutators,
} = useWorkspace()

const url = ref('')

const collections = computed(() =>
  activeWorkspaceCollections.value.flatMap((collection) =>
    collection.info?.title === 'Drafts'
      ? []
      : {
          id: collection.uid,
          label: collection.info?.title ?? 'Unititled Collection',
        },
  ),
)

/** Currently selected collection with a reasonable default */
const selectedCollection = ref<ScalarComboboxOption | undefined>(
  collections.value.find(
    (collection) => collection.id === activeCollection.value?.uid,
  ),
)

const handleSubmit = () => {
  if (!url.value.trim()) {
    toast('Please enter a valid url before creating a server.', 'error')
    return
  }
  const collectionUid = selectedCollection.value?.id
  if (!collectionUid) return

  const server = serverMutators.add({ url: url.value }, collectionUid)

  // Select the server
  collectionMutators.edit(collectionUid, 'selectedServerUid', server.uid)

  emits('close')
}

const input = ref<HTMLInputElement | null>(null)
onMounted(() => nextTick(() => input.value?.focus()))
</script>
<template>
  <div class="flex w-full flex-col gap-3">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <input
        id="serverName"
        ref="input"
        v-model="url"
        autocomplete="off"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        data-form-type="other"
        data-lpignore="true"
        placeholder="Server URL"
        @keydown.prevent.enter="handleSubmit" />
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
        :disabled="!url.trim()"
        @click="handleSubmit">
        Create Server
      </ScalarButton>
    </div>
  </div>
</template>
