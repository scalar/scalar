<script lang="ts" setup>
import {
  ScalarIconBookOpen,
  ScalarIconBracketsCurly,
  ScalarIconCloud,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconLockSimple,
  ScalarIconPlugsConnected,
  ScalarIconSparkle,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { type ScalarIconComponent } from '@scalar/icons/types'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { useApiReferenceLocalization } from '@/features/localization'

import ApiReferenceToolbarBlurb from './ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarRegisterButton from './ApiReferenceToolbarRegisterButton.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()
const { translate } = useApiReferenceLocalization()

const FEATURES = [
  { icon: ScalarIconLockSimple, labelKey: 'developerTools.passwordProtection' },
  { icon: ScalarIconGlobeSimple, labelKey: 'developerTools.customDomains' },
  { icon: ScalarIconBookOpen, labelKey: 'developerTools.freeFormContent' },
  { icon: ScalarIconCloud, labelKey: 'developerTools.cdnInfrastructure' },
  { icon: ScalarIconGitBranch, labelKey: 'developerTools.pullFromGitHub' },
  { icon: ScalarIconFileMd, labelKey: 'developerTools.markdownMdx' },
  {
    icon: ScalarIconWarningOctagon,
    labelKey: 'developerTools.spectralLinting',
  },
  {
    icon: ScalarIconBracketsCurly,
    labelKey: 'developerTools.jsonSchemaHosting',
  },
  { icon: ScalarIconSparkle, labelKey: 'developerTools.askAi' },
  { icon: ScalarIconPlugsConnected, labelKey: 'developerTools.mcpServers' },
] as const satisfies ReadonlyArray<{
  icon: ScalarIconComponent
  labelKey: string
}>
</script>
<template>
  <ul class="text-c-2 mb-2 grid grid-cols-2 gap-2.5 font-medium">
    <li
      v-for="feature in FEATURES"
      :key="feature.labelKey"
      class="flex items-center gap-2">
      <component
        :is="feature.icon"
        class="text-c-3 size-3.5"
        weight="bold" />
      {{ translate(feature.labelKey) }}
    </li>
  </ul>
  <ApiReferenceToolbarRegisterButton
    :externalUrls
    :workspace>
    {{ translate('developerTools.deployOnScalar') }}
  </ApiReferenceToolbarRegisterButton>
  <ApiReferenceToolbarBlurb>
    {{ translate('developerTools.deployFree') }} <br />
    {{ translate('developerTools.additionalFeaturesMightRequire') }}
    <span>
      <a
        href="https://scalar.com/products/docs/getting-started"
        target="_blank">
        Scalar Pro.
      </a>
    </span>
  </ApiReferenceToolbarBlurb>
</template>
