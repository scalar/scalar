<script lang="ts" setup>
import { ScalarIconButton } from '@scalar/components'
import { ScalarIconCopy, ScalarIconInfo } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const CONFIG_SETTING = 'showToolbar: "never"'

const { copyToClipboard } = useClipboard()
</script>
<template>
  <ApiReferenceToolbarPopover
    class="w-120"
    placement="bottom-start">
    <template #button>
      <button
        type="button"
        class="text-c-2 hover:text-c-1 hover:bg-b-2 flex items-center gap-1 rounded px-2 py-2.25 text-base leading-none">
        Configuration Toolbar
        <ScalarIconInfo />
      </button>
    </template>
    <div class="-m-2 flex flex-col gap-2 leading-relaxed">
      <div>
        The configuration toolbar allows you to customize the appearance and
        behavior of your documentation. You can also share your documentation
        using the Scalar Registry.
      </div>
      <div>
        To disable the toolbar, set
        <div
          class="bg-b-2 inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-sm">
          <code class="font-code">{{ CONFIG_SETTING }}</code>
          <ScalarIconButton
            :icon="ScalarIconCopy"
            label="Copy link to clipboard"
            class="-m-1 p-1.25"
            size="sm"
            @click="copyToClipboard(CONFIG_SETTING)" />
        </div>
        in your configuration.
      </div>
    </div>
    <template #info>
      The configuration toolbar will only appear when running on localhost
    </template>
  </ApiReferenceToolbarPopover>
</template>
