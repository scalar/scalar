<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'

import { useDarkModeState } from '../hooks/useDarkModeState'
import { FlowIcon } from './Icon'
import ScreenReader from './ScreenReader.vue'

const { toggleDarkMode, isDark } = useDarkModeState()
</script>
<template>
  <button
    class="darklight"
    type="button"
    @click="toggleDarkMode">
    <FlowIcon :icon="isDark ? 'DarkMode' : 'LightMode'" />
    <ScreenReader>
      Switch to {{ isDark ? 'Light' : 'Dark' }} Mode
    </ScreenReader>
  </button>
</template>
<style scoped>
.darklight {
  color: var(
    --sidebar-color-2,
    var(
      --default-sidebar-color-2,
      var(--theme-color-2, var(--default-theme-color-2))
    )
  );
  display: flex;
  align-items: center;

  height: 24px;
  width: 24px;

  padding: 4px;
}
.darklight:hover {
  cursor: pointer;
  color: var(
    --sidebar-color-1,
    var(
      --default-sidebar-color-1,
      var(--theme-color-1, var(--default-theme-color-1))
    )
  );
}
</style>
