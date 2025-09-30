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

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()

const FEATURES = [
  { icon: ScalarIconGlobeSimple, label: 'Custom Domains' },
  { icon: ScalarIconGitBranch, label: 'GitHub Sync' },
  { icon: ScalarIconFileMd, label: 'Markdown/MDX' },
  { icon: ScalarIconLockSimple, label: 'Password Protection' },
  { icon: ScalarIconWarningOctagon, label: 'Spectral Linting' },
  { icon: ScalarIconBracketsCurly, label: 'JSON Schema Support' },
] as const satisfies ReadonlyArray<{
  icon: ScalarIconComponent
  label: string
}>
</script>
<template>
  <ul class="text-c-2 grid grid-cols-2 gap-2.5 font-medium">
    <li
      v-for="feature in FEATURES"
      :key="feature.label"
      class="flex items-center gap-2">
      <component
        :is="feature.icon"
        class="text-c-3 size-3.5"
        weight="bold" />
      {{ feature.label }}
    </li>
  </ul>
  <ApiReferenceToolbarRegisterButton :workspace>
    Deploy on Scalar
  </ApiReferenceToolbarRegisterButton>
  <ApiReferenceToolbarBlurb>
    Uploading documents to the Scalar Registry is a Premium feature. See what
    else is included in our
    <a
      href="https://guides.scalar.com/"
      target="_blank">
      guides</a
    >.
  </ApiReferenceToolbarBlurb>
</template>
