<script lang="ts" setup>
import { ScalarButton, useLoadingState } from '@scalar/components'
import {
  ScalarIconBracketsCurly,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconLockSimple,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { type ScalarIconComponent } from '@scalar/icons/types'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { nextTick } from 'vue'

import { DASHBOARD_REGISTER_URL } from '@/consts/urls'
import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import { uploadTempDocument } from '@/features/toolbar/uploadTempDocument'

const FEATURES = [
  { icon: ScalarIconLockSimple, label: 'Password Protected' },
  { icon: ScalarIconGlobeSimple, label: 'Custom Domains' },
  { icon: ScalarIconWarningOctagon, label: 'Spectral Rules' },
  { icon: ScalarIconGitBranch, label: 'Bi-directional Git' },
  { icon: ScalarIconFileMd, label: 'Markdown Files' },
  { icon: ScalarIconBracketsCurly, label: 'Json Schema Support' },
] as const satisfies ReadonlyArray<{
  icon: ScalarIconComponent
  label: string
}>

const { workspace } = defineProps<{
  workspace?: WorkspaceStore
}>()

const tempDocUrl = defineModel<string>('url')

const { toast } = useToasts()
const loading = useLoadingState()

function openRegisterLink(docUrl: string) {
  const url = new URL(DASHBOARD_REGISTER_URL)
  url.searchParams.set('url', docUrl)
  window.open(url.toString(), '_blank')
  return
}

async function generateRegisterLink() {
  if (loading.isLoading || !workspace) {
    return
  }

  if (tempDocUrl.value) {
    openRegisterLink(tempDocUrl.value)
    return
  }

  loading.startLoading()

  const document = workspace.exportActiveDocument('json')

  if (!document) {
    toast('Unable to export active document', 'error')
    loading.invalidate()
    return
  }

  try {
    tempDocUrl.value = await uploadTempDocument(document)
    await loading.validate(600)
    openRegisterLink(tempDocUrl.value)

    await nextTick()

    loading.clear()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    toast(message, 'error')
    loading.invalidate()
  }
}
</script>
<template>
  <ul class="text-c-2 grid grid-cols-2 gap-2.5 font-medium">
    <li
      v-for="feature in FEATURES"
      :key="feature.label"
      class="flex items-center gap-2">
      <component
        :is="feature.icon"
        weight="bold"
        class="text-c-3 size-3.5" />
      {{ feature.label }}
    </li>
  </ul>
  <ScalarButton
    class="h-auto p-2.5"
    :loading
    @click="generateRegisterLink">
    Generate
  </ScalarButton>
  <ApiReferenceToolbarBlurb>
    Uploading links to Scalar Registry, is part of Scalar's Premium features.
    Explore all features on our
    <a
      href="https://guides.scalar.com/"
      target="_blank">
      guides</a
    >.
  </ApiReferenceToolbarBlurb>
</template>
