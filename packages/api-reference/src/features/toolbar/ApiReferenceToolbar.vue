<script lang="ts" setup>
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import ApiReferenceToolbarConfig from '@/features/toolbar/ApiReferenceToolbarConfig.vue'
import ApiReferenceToolbarSdks from '@/features/toolbar/ApiReferenceToolbarSdks.vue'
import ApiReferenceToolbarShare from '@/features/toolbar/ApiReferenceToolbarShare.vue'

defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const showToolbar = computed<boolean>(() => {
  if (!window) {
    return false
  }

  // Only show the toolbar if the "toolbar" URL parameter is set to a truthy value
  const params = new URLSearchParams(window.location.search)
  const featureParam = params.get('toolbar')
  if (!featureParam || featureParam === '0' || featureParam === 'false') {
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
      <template v-if="workspace">
        <ApiReferenceToolbarShare :workspace />
        <ApiReferenceToolbarSdks :workspace />
      </template>
      <ApiReferenceToolbarConfig
        :configuration
        v-model:overrides="overrides" />
    </div>
  </header>
</template>
