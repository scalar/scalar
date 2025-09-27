<script lang="ts" setup>
import {
  ScalarIconBracketsCurly,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconLockSimple,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { type ScalarIconComponent } from '@scalar/icons/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarRegisterButton from '@/features/toolbar/ApiReferenceToolbarRegisterButton.vue'

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
  workspace: WorkspaceStore
}>()
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
  <ApiReferenceToolbarRegisterButton :workspace />
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
