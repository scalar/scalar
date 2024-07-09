<script lang="ts" setup>
import ScreenReader from '@/components/ScreenReader.vue'
import { useDarkModeState } from '@/hooks'
import { ScalarIcon } from '@scalar/components'

const { toggleDarkMode, isDark } = useDarkModeState()
</script>
<template>
  <button
    class="w-[37px] hover:bg-b-2 flex items-center justify-center rounded-lg p-[7px]"
    type="button"
    @click="toggleDarkMode">
    <ScalarIcon
      class="block h-6 w-6 stroke-[1.5]"
      icon="LightDarkModeToggle" />
    <ScreenReader>
      Switch to {{ isDark ? 'Light' : 'Dark' }} Mode
    </ScreenReader>
  </button>
</template>
