<script lang="ts" setup>
import {
  ScalarFormSection,
  ScalarIconButton,
  ScalarTextInput,
} from '@scalar/components'
import { ScalarIconCopy } from '@scalar/icons'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  store: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const tempUrl = computed<string>(() => {
  const data = encodeURIComponent(JSON.stringify(configuration))
  return `https://editor.scalar.com/preview?config=${data}`
})

const { copyToClipboard } = useClipboard()
</script>
<template>
  <ApiReferenceToolbarPopover class="w-100">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Temporary Link</template>
      <ScalarTextInput
        readonly
        :modelValue="tempUrl"
        @click="copyToClipboard(tempUrl)">
        <template #aside>
          <ScalarIconButton
            :icon="ScalarIconCopy"
            label="Copy link to clipboard"
            class="-m-1 -mr-1.5"
            size="sm"
            @click="copyToClipboard(tempUrl)" />
        </template>
      </ScalarTextInput>
      <ApiReferenceToolbarBlurb class="-mt-1">
        Currently sharing is only available for hosted specifications configured
        with a <code>URL</code>.
      </ApiReferenceToolbarBlurb>
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
