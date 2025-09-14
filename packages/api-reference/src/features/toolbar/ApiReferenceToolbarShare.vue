<script lang="ts" setup>
import {
  ScalarFormSection,
  ScalarIconButton,
  ScalarTextInput,
} from '@scalar/components'
import {
  ScalarIconBracketsCurly,
  ScalarIconCopy,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconLockSimple,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { type ScalarIconComponent } from '@scalar/icons/types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed } from 'vue'

import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

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

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const editorShareHref = computed<string>(() => {
  const encodedConfig = encodeURIComponent(JSON.stringify(configuration))
  return `https://editor.scalar.com/preview?config=${encodedConfig}`
})

const registrySignupHref = computed<string>(() => {
  const encodedSpecUrl = encodeURIComponent(configuration?.url ?? '')
  return `https://dashboard.scalar.com/register?url=${encodedSpecUrl}`
})

const { copyToClipboard } = useClipboard()
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Temporary Link</template>
      <ScalarTextInput
        readonly
        :modelValue="editorShareHref"
        @click="copyToClipboard(editorShareHref)">
        <template #aside>
          <ScalarIconButton
            :icon="ScalarIconCopy"
            label="Copy link to clipboard"
            class="-m-1 -mr-1.5"
            size="sm"
            @click="copyToClipboard(editorShareHref)" />
        </template>
      </ScalarTextInput>
      <ApiReferenceToolbarBlurb class="-mt-1">
        Currently sharing is only available for hosted specifications configured
        with a <code>URL</code>.
      </ApiReferenceToolbarBlurb>
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
