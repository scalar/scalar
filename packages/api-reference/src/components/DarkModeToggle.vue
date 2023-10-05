<script lang="ts" setup>
import { watchEffect } from 'vue'

import { useDarkModeState } from '../hooks/useDarkModeState'
import { FlowIcon } from './Icon'

const { toggleDarkMode, isDark } = useDarkModeState()

watchEffect(() => {
  document.body.classList.toggle('dark-mode', isDark.value)
  document.body.classList.toggle('light-mode', !isDark.value)
})
</script>
<template>
  <button
    class="darklight"
    type="button"
    @click="toggleDarkMode">
    <FlowIcon icon="LightDarkModeToggle" />
    <template v-if="isDark">
      <span>Light Mode</span>
    </template>
    <template v-else>
      <span>Dark Mode</span>
    </template>
  </button>
</template>
<style scoped>
.darklight {
  border-top: 1px solid
    var(
      --sidebar-border-color,
      var(
        --default-sidebar-border-color,
        var(--theme-border-color, var(--default-theme-border-color))
      )
    );
  color: var(
    --sidebar-color-2,
    var(
      --default-sidebar-color-2,
      var(--theme-color-2, var(--default-theme-color-2))
    )
  );

  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  appearance: none;
  margin-top: auto;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  text-indent: 9px;
}

.darklight:hover {
  cursor: pointer;
  opacity: 0.9;
}

.darklight svg {
  stroke: currentColor;
  height: 12px;
  width: 12px;
}
</style>
../hooks/useDarkModeState
