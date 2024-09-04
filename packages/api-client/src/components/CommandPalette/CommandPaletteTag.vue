<script setup lang="ts">
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  type ScalarComboboxOption,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, onMounted, ref } from 'vue'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { activeWorkspaceCollections, activeCollection, tagMutators } =
  useWorkspace()
const { toast } = useToasts()

const availableCollections = computed(() =>
  activeWorkspaceCollections.value.map((collection) => ({
    id: collection.uid,
    label: collection.info?.title ?? '',
  })),
)

const name = ref('')
const selectedCollection = ref<ScalarComboboxOption | undefined>(
  availableCollections.value.find(
    (option) => option.id === activeCollection.value?.uid,
  ),
)

const handleSubmit = () => {
  if (!name.value) {
    toast('Please enter a name before creating a tag.', 'error')
    return
  }
  if (!name.value || !selectedCollection.value) return

  const tag = tagMutators.add(
    {
      name: name.value,
    },
    selectedCollection.value.id,
  )
  if (tag) emits('close')
}

const input = ref<HTMLInputElement | null>(null)

onMounted(() => input.value?.focus())
</script>
<template>
  <div class="flex w-full flex-col gap-3">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="tagName"></label>
      <input
        id="tagName"
        ref="input"
        v-model="name"
        autocomplete="off"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        data-form-type="other"
        data-lpignore="true"
        placeholder="Tag Name"
        @keydown.prevent.enter="handleSubmit" />
    </div>
    <div class="flex">
      <div class="flex flex-1 gap-2 max-h-8">
        <ScalarListbox
          v-model="selectedCollection"
          :options="availableCollections">
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
        :disabled="!name.trim()"
        @click="handleSubmit">
        Create Tag
      </ScalarButton>
    </div>
  </div>
</template>
