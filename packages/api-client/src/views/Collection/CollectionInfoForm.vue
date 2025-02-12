<script setup lang="ts">
import LabelInput from '@/components/Form/LabelInput.vue'
import IconSelector from '@/components/IconSelector.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarButton, ScalarMarkdown } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { computed, ref } from 'vue'

const { activeCollection } = useActiveEntities()
const { collectionMutators } = useWorkspace()

const collectionIcon =
  activeCollection?.value?.['x-scalar-icon'] || ref('interface-content-folder')

const fields = [
  { label: 'Title', key: 'title', placeholder: 'My Collection' },
  {
    label: 'Description',
    key: 'description',
    placeholder: 'This API is nuts.',
  },
  { label: 'Version', key: 'version', placeholder: '1.0.0' },
]

const updateInfo = (key: string, value: string) => {
  if (!activeCollection?.value?.uid) {
    return
  }

  collectionMutators.updateInfo(activeCollection?.value?.uid, {
    [key]: value,
  })
}

const updateCollectionIcon = (value: string) => {
  if (!activeCollection?.value?.uid) {
    return
  }

  collectionMutators.edit(activeCollection?.value?.uid, 'x-scalar-icon', value)
}

const updateCollectionName = (value: string) => {
  if (!activeCollection.value) return

  collectionMutators.edit(activeCollection.value.uid, 'info.title', value)
}

const data = computed(() => {
  return {
    icon: activeCollection?.value?.['x-scalar-icon'],
    title: activeCollection?.value?.info?.title,
    description: activeCollection?.value?.info?.description,
    version: activeCollection?.value?.info?.version,
  }
})
</script>
<template>
  <div
    :aria-label="`Collection: ${data.title}`"
    class="flex flex-col mx-auto justify-center gap-2 pt-6 w-full md:w-3/5">
    <div class="relative">
      <IconSelector
        v-model="collectionIcon"
        placement="bottom-start"
        @update:modelValue="updateCollectionIcon(collectionIcon)">
        <ScalarButton
          class="absolute cursor-pointer -left-7 top-1/2 -translate-y-1/2 h-6 w-6 aspect-square p-0.25 rounded hover:bg-b-2"
          variant="ghost">
          <LibraryIcon
            class="size-4 text-c-2 stroke-[1.75]"
            :src="collectionIcon" />
        </ScalarButton>
      </IconSelector>
      <div class="group">
        <LabelInput
          inputId="collectionName"
          placeholder="Collection Name"
          :value="data.title"
          @updateValue="updateCollectionName" />
      </div>
    </div>
    <p class="leading-normal mt-3 text-c-2">
      <ScalarMarkdown :value="data.description" />
    </p>
  </div>
</template>
<style scoped>
:deep(.markdown) h2 {
  @apply text-lg;
}
.group-hover-input {
  border-width: var(--scalar-border-width);
  border-color: transparent;
}
.group:hover .group-hover-input {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  border-color: var(--scalar-border-color);
}
.group-hover-input:focus {
  background: transparent !important;
  border-color: var(--scalar-border-color) !important;
}
</style>
