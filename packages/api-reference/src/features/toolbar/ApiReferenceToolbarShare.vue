<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components'
import {
  ScalarIconBracketsCurly,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconLockSimple,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { type ScalarIconComponent } from '@scalar/icons/types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { DASHBOARD_REGISTER_URL } from '@/consts/urls'
import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareTemporary from '@/features/toolbar/ApiReferenceToolbarShareTemporary.vue'

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

const { configuration, workspace } = defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const registrySignupHref = computed<string>(() => {
  const urlEncodedDocument = encodeURIComponent(configuration?.url ?? '')
  const url = new URL(DASHBOARD_REGISTER_URL)
  url.searchParams.append('url', urlEncodedDocument)
  return url.toString()
})
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Temporary Link</template>
      <ApiReferenceToolbarShareTemporary :workspace />
    </ScalarFormSection>
    <ScalarFormSection>
      <template #label>Permanent Link</template>
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
      <a
        :href="registrySignupHref"
        target="_blank"
        rel="noopener"
        class="bg-b-btn text-c-btn hover:bg-h-btn mt-1 flex items-center justify-center rounded p-2.5 text-sm font-medium">
        Generate
      </a>
      <ApiReferenceToolbarBlurb>
        Uploading links to Scalar Registry, is part of Scalar's Premium
        features. Explore all features on our
        <a
          href="https://guides.scalar.com/"
          target="_blank">
          guides</a
        >.
      </ApiReferenceToolbarBlurb>
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
