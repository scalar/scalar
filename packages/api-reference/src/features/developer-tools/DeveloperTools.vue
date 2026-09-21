<script lang="ts" setup>
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type {
  ApiReferenceConfiguration,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, defineAsyncComponent } from 'vue'

const { configuration, externalUrls, workspace } = defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
  externalUrls: ExternalUrls
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

// Evaluate visibility before importing the toolbar and its configuration, share, and deploy UI.
const DeveloperToolsToolbar = defineAsyncComponent(
  () => import('./DeveloperToolsToolbar.vue'),
)

const showDeveloperTools = computed<boolean>(() => {
  if (configuration?.showDeveloperTools === 'always') {
    return true
  }

  if (configuration?.showDeveloperTools === 'never') {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  return isLocalUrl(window.location.href)
})
</script>
<template>
  <DeveloperToolsToolbar
    v-if="showDeveloperTools"
    v-model:overrides="overrides"
    :configuration
    :externalUrls
    :workspace />
</template>
