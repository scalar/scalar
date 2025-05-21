<script setup lang="ts">
import { ScalarButton } from '@scalar/components'

import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { useLayout } from '@/hooks'

const props = defineProps<{
  click: () => void
  hotkey?: string
}>()

const { layout } = useLayout()

const handleClick = () => {
  props.click()
}
</script>
<template>
  <ScalarButton
    class="bg-b-1 text-c-1 hover:bg-b-2 group relative h-auto w-auto border px-2 py-1 md:w-full md:p-1.5"
    icon="Plus"
    variant="outlined"
    @click="handleClick">
    <slot name="title" />
    <ScalarHotkey
      v-if="hotkey && layout === 'desktop'"
      class="text-c-2 add-item-hotkey absolute right-2 hidden group-hover:opacity-80 md:block"
      :hotkey="hotkey" />
  </ScalarButton>
</template>
