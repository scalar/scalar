<script lang="ts" setup>
import {
  ScalarIconBookOpen,
  ScalarIconBracketsCurly,
  ScalarIconCloud,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconLockSimple,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { type ScalarIconComponent } from '@scalar/icons/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarBlurb from './ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarRegisterButton from './ApiReferenceToolbarRegisterButton.vue'

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()

const FEATURES = [
  { icon: ScalarIconLockSimple, label: 'Password Protection' },
  { icon: ScalarIconGlobeSimple, label: 'Custom Domains' },
  { icon: ScalarIconBookOpen, label: 'Free-form content' },
  { icon: ScalarIconCloud, label: 'CDN Infrastructure' },
  { icon: ScalarIconGitBranch, label: 'Pull from GitHub' },
  { icon: ScalarIconFileMd, label: 'Markdown/MDX' },
  { icon: ScalarIconWarningOctagon, label: 'Spectral Linting' },
  { icon: ScalarIconBracketsCurly, label: 'JSON Schema Hosting' },
] as const satisfies ReadonlyArray<{
  icon: ScalarIconComponent
  label: string
}>
</script>
<template>
  <ul class="text-c-2 mb-2 grid grid-cols-2 gap-2.5 font-medium">
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
    Deploy your documentation for free. <br />
    Additional features might require
    <a
      href="https://scalar.com/products/docs/getting-started"
      target="_blank"
      >Scalar Pro</a
    >.
  </ApiReferenceToolbarBlurb>
</template>
