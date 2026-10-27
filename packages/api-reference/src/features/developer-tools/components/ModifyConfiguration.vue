<script lang="ts" setup>
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import { useLocalization } from '@/features/localization'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ModifyConfigurationForm from './ModifyConfigurationForm.vue'

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')
const { translate } = useLocalization()
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>{{ translate('developerTools.configure') }}</template>
    <ModifyConfigurationForm
      v-model:overrides="overrides"
      :configuration />
  </ApiReferenceToolbarPopover>
</template>
