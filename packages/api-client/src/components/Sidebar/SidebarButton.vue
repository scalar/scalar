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
  <div class="fixed relative bottom-[50px] z-10 flex p-2">
    <ScalarButton
      class="bg-b-1 text-c-1 hover:bg-b-2 group relative w-full border p-1.5 h-auto"
      icon="Plus"
      variant="outlined"
      @click="handleClick">
      <slot name="title" />
      <ScalarHotkey
        class="absolute right-2 group-hover:opacity-80 text-c-2"
        hotkey="K"
        @hotkeyPressed="handleClick" />
    </ScalarButton>
  </div>
</template>
