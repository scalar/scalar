<script lang="ts" setup>
/**
 * What the developer tools are and how to turn them off, behind the "Developer Tools" title. The
 * toolbar popover and the localhost shell's side panel both render it.
 */
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconCopy } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import { useLocalization } from '@/features/localization'

const CONFIG_SETTING = 'showDeveloperTools: "never"'

const { copyToClipboard } = useClipboard()
const { translate } = useLocalization()
</script>
<template>
  <!-- Two roots: each caller supplies the wrapper, so the popover keeps its exact markup -->
  <div>{{ translate('developerTools.intro') }}</div>
  <div>
    {{ translate('developerTools.disableToolbarBefore') }}
    <div
      class="bg-b-2 inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-sm">
      <code class="font-code">{{ CONFIG_SETTING }}</code>
      <ScalarIconButton
        class="-m-1 p-1.25"
        :icon="ScalarIconCopy"
        :label="translate('actions.copyToClipboard')"
        size="sm"
        @click="copyToClipboard(CONFIG_SETTING)" />
    </div>
    {{ translate('developerTools.disableToolbarAfter') }}
  </div>
</template>
