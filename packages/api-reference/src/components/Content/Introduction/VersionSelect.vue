<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { ref } from 'vue'

const { versionSelect } = defineProps<{
  versionSelect: NonNullable<ReferenceConfiguration['versionSelect']>
}>()

/** Grab the initial version from the versions array else the first version */
const initialVersion =
  versionSelect.versions.find(
    ({ id }) => id === versionSelect.initialVersion,
  ) || versionSelect.versions[0]

/** Keep track of the currently selected version */
const selectedVersion = ref<{ id: string; label: string }>(initialVersion)
</script>
<template>
  <label class="bg-b-2 flex h-8 items-center px-3 py-2.5 text-sm font-medium">
    {{ versionSelect?.label ?? 'Versions' }}
  </label>

  <ScalarListbox
    v-if="versionSelect?.versions?.length"
    :options="versionSelect?.versions"
    v-model="selectedVersion"
    @update:modelValue="versionSelect?.callback"
    placement="bottom-start"
    resize>
    <ScalarButton
      class="gap-0.75 text-c-1 h-6.5 w-full justify-start whitespace-nowrap rounded-b-lg px-3 py-1.5 text-xs font-normal -outline-offset-1 lg:text-sm"
      variant="ghost">
      {{ selectedVersion?.label }}
      <ScalarIcon
        class="text-c-2"
        icon="ChevronDown"
        size="sm" />
    </ScalarButton>
  </ScalarListbox>
</template>
