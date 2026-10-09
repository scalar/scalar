<script setup lang="ts">
import { computed } from 'vue'

import { useLocalization } from '@/v2/features/localization'

const props = defineProps<{
  value: string
  controls: string | undefined
}>()

const emit = defineEmits<{
  (e: 'change', v: string): void
}>()

const { translate } = useLocalization()

const model = computed<string>({
  get: () => props.value,
  set: (v) => emit('change', v),
})
</script>
<template>
  <input
    v-model="model"
    v-bind="controls ? { ...$attrs, 'aria-controls': controls } : {}"
    autocomplete="off"
    class="text-c-1 w-full border-transparent px-1.5 py-1.25 -outline-offset-1 group-last/label:rounded-br-lg"
    :placeholder="translate('apiClient.serverVariablesTextbox.value')"
    spellcheck="false"
    type="text" />
</template>
