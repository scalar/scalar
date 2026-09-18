<script lang="ts" setup>
import { useLocalization } from '@/v2/features/localization'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const { translate } = useLocalization()
</script>
<template>
  <div
    class="text-c-3 text-xxs -my-1 flex justify-center gap-0.5 rounded p-0.5">
    <button
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': modelValue }"
      type="button"
      @click.stop="$emit('update:modelValue', true)">
      {{ translate('apiClient.responseBodyToggle.preview') }}
    </button>
    <button
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': !modelValue }"
      type="button"
      @click.stop="$emit('update:modelValue', false)">
      {{ translate('apiClient.responseBodyToggle.raw') }}
    </button>
  </div>
</template>
