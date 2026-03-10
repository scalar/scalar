<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareRegister from './ApiReferenceToolbarShareRegister.vue'

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()
</script>

<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Deploy</template>
    <ScalarFormSection>
      <template #label>Scalar Docs</template>
      <p class="text-c-2 mb-2 leading-normal">
        Deploy your documentation on Scalar, the modern documentation platform
        for your API and everything else.
      </p>
      <ApiReferenceToolbarShareRegister :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
