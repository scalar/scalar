<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { ScalarButton } from '@scalar/components'

const props = defineProps<{
  click: () => void
}>()

const handleClick = () => {
  props.click()
}
</script>
<template>
  <div class="fixed relative bottom-[42px] z-10 flex px-2.5 pb-2 pt-0">
    <ScalarButton
      class="bg-b-1 text-c-1 hover:bg-b-2 group relative w-full border-1/2 p-1.5 h-auto"
      icon="Plus"
      variant="outlined"
      @click="handleClick">
      <slot name="title" />
      <ScalarHotkey
        class="absolute right-2 group-hover:opacity-80 text-c-2 add-item-hotkey"
        hotkey="K"
        @hotkeyPressed="handleClick" />
    </ScalarButton>
  </div>
</template>
