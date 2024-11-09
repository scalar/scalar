<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { useLayout } from '@/hooks'
import { ScalarButton } from '@scalar/components'

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
    class="bg-b-1 text-c-1 hover:bg-b-2 group relative w-auto md:w-full border-1/2 px-2 py-1 md:p-1.5 h-auto"
    icon="Plus"
    variant="outlined"
    @click="handleClick">
    <slot name="title" />
    <ScalarHotkey
      v-if="hotkey && layout === 'desktop'"
      class="hidden md:block absolute right-2 group-hover:opacity-80 text-c-2 add-item-hotkey"
      :hotkey="hotkey" />
  </ScalarButton>
</template>
