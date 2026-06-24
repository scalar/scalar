<script lang="ts" setup>
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconCopy, ScalarIconInfo } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import { useApiReferenceLocalization } from '@/features/localization'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'

const CONFIG_SETTING = 'showDeveloperTools: "never"'

const { copyToClipboard } = useClipboard()
const { translate } = useApiReferenceLocalization()
</script>
<template>
  <ApiReferenceToolbarPopover
    class="w-120"
    placement="bottom-start">
    <template #button>
      <button
        class="text-c-2 hover:text-c-1 hover:bg-b-2 ml-auto flex items-center gap-1 rounded px-2 py-2.25 text-base leading-none"
        type="button">
        <ScalarIconInfo />
        {{ translate('developerTools.title') }}
      </button>
    </template>
    <div class="-m-2 flex flex-col gap-2 leading-relaxed">
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
    </div>
    <template #info>
      {{ translate('developerTools.localhostOnly') }}
    </template>
  </ApiReferenceToolbarPopover>
</template>
