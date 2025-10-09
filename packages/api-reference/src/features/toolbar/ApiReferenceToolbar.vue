<script lang="ts" setup>
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { type ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import ApiReferenceToolbarConfig from '@/features/toolbar/ApiReferenceToolbarConfig.vue'
import ApiReferenceToolbarSdks from '@/features/toolbar/ApiReferenceToolbarSdks.vue'
import ApiReferenceToolbarShare from '@/features/toolbar/ApiReferenceToolbarShare.vue'
import ApiReferenceToolbarTitle from '@/features/toolbar/ApiReferenceToolbarTitle.vue'

const { configuration } = defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const showToolbar = computed<boolean>(() => {
  if (configuration?.showToolbar === 'always') {
    return true
  }

  if (configuration?.showToolbar === 'never') {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  return isLocalUrl(window.location.href)
})
</script>
<template>
  <header
    v-if="showToolbar"
    aria-label="Developer Tools"
    class="api-reference-toolbar h-header bg-b-1 sticky top-0 z-10 flex justify-center border-b px-15">
    <div
      class="-mx-2 flex max-w-(--refs-content-max-width) flex-1 items-center">
      <div class="flex flex-1 items-center">
        <ApiReferenceToolbarTitle />
      </div>
      <template v-if="workspace">
        <ApiReferenceToolbarShare :workspace />
        <ApiReferenceToolbarSdks :workspace />
      </template>
      <ApiReferenceToolbarConfig
        v-model:overrides="overrides"
        :configuration />
    </div>
  </header>
</template>
