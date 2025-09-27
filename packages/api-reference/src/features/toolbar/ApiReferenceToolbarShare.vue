<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { ref } from 'vue'

import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareRegister from '@/features/toolbar/ApiReferenceToolbarShareRegister.vue'
import ApiReferenceToolbarShareTemporary from '@/features/toolbar/ApiReferenceToolbarShareTemporary.vue'

const { workspace } = defineProps<{
  workspace?: WorkspaceStore
}>()

/** The temporary document URL if we've uploaded it */
const tempDocUrl = ref<string>('')
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Temporary Link</template>
      <ApiReferenceToolbarShareTemporary
        v-model:url="tempDocUrl"
        :workspace />
    </ScalarFormSection>
    <ScalarFormSection>
      <template #label>Permanent Link</template>
      <ApiReferenceToolbarShareRegister
        v-model:url="tempDocUrl"
        :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
