<script lang="ts" setup>
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import ApiReferenceToolbarConfig from '@/features/toolbar/ApiReferenceToolbarConfig.vue'
import ApiReferenceToolbarSdks from '@/features/toolbar/ApiReferenceToolbarSdks.vue'
import ApiReferenceToolbarShare from '@/features/toolbar/ApiReferenceToolbarShare.vue'

/** Turn this on to enabled the localhost toolbar */
const FEATURE_FLAG = true as const

defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const showToolbar = computed<boolean>(() => {
  if (!window || !FEATURE_FLAG) {
    return false
  }
  return isLocalUrl(window.location.href)
})
</script>
<template>
  <header
    v-if="showToolbar"
    class="api-reference-toolbar h-header bg-b-1 sticky top-0 z-10 flex justify-center border-b px-15">
    <div
      class="flex max-w-(--refs-content-max-width) flex-1 items-center justify-end">
      <ApiReferenceToolbarShare
        :configuration
        :workspace />
      <ApiReferenceToolbarSdks :configuration />
      <ApiReferenceToolbarConfig
        :configuration
        v-model:overrides="overrides" />
    </div>
  </header>
</template>
