<script lang="ts" setup>
import { ScalarIconInfo } from '@scalar/icons'

import { useLocalization } from '@/features/localization'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import DeveloperToolsAbout from './DeveloperToolsAbout.vue'

const { translate } = useLocalization()
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
      <DeveloperToolsAbout />
    </div>
    <template #info>
      {{ translate('developerTools.localhostOnly') }}
    </template>
  </ApiReferenceToolbarPopover>
</template>
