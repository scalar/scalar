<script lang="ts" setup>
import ScreenReader from '@/components/ScreenReader.vue'
import { useDarkModeState } from '@/hooks'
import { ScalarIcon } from '@scalar/components'

const { toggleDarkMode, isDark } = useDarkModeState()
</script>
<template>
  <button
    class="min-w-[37px] max-w-[37px] hover:bg-b-2 flex items-center justify-center rounded-lg p-[7px] text-c-3 focus:text-c-1 w-full aspect-square scalar-app-nav-padding"
    type="button"
    @click="toggleDarkMode">
    <ScalarIcon
      class="block h-6 w-6"
      icon="LightDarkModeToggle"
      thickness="1.5" />
    <ScreenReader>
      Switch to {{ isDark ? 'Light' : 'Dark' }} Mode
    </ScreenReader>
  </button>
</template>
