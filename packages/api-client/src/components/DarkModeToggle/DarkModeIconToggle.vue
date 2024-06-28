<script lang="ts" setup>
import ScreenReader from '@/components/ScreenReader.vue'
import { useDarkModeState } from '@/hooks'
import { ScalarIcon } from '@scalar/components'

const { toggleDarkMode, isDark } = useDarkModeState()
</script>
<template>
  <button
    class="w-[37px] hover:text-c-1 flex items-center justify-center rounded-lg p-2"
    type="button"
    @click="toggleDarkMode">
    <ScalarIcon
      class="block h-6 w-6 stroke-[0.75]"
      icon="LightDarkModeToggle" />
    <ScreenReader>
      Switch to {{ isDark ? 'Light' : 'Dark' }} Mode
    </ScreenReader>
  </button>
</template>
