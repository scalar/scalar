<script lang="ts" setup>
import { onMounted, watchEffect } from 'vue'

import { useDarkModeState } from '../hooks/useDarkModeState'
import { FlowIcon } from './Icon'

const { toggleDarkMode, isDark } = useDarkModeState()

// todo move to refs so ssg doesnt break
onMounted(() => {
  watchEffect(() => {
    document.body.classList.toggle('dark-mode', isDark.value)
    document.body.classList.toggle('light-mode', !isDark.value)
  })
})
</script>
<template>
  <div class="darklight-reference">
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
    <a
      class="darklight-reference-promo"
      href="https://www.scalar.com"
      target="_blank">
      Powered by scalar.com
    </a>
  </div>
</template>
<style scoped>
.darklight {
  border: none;
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
  background: transparent;
  outline: none;
  padding: 18px 24px 0;
  display: flex;

  align-items: center;
  text-indent: 9px;
  width: 100%;
}
.darklight-reference {
  width: 100%;
  margin-top: auto;
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

.darklight svg {
  stroke: currentColor;
  height: 12px;
  width: 12px;
}
.darklight-reference-promo {
  padding: 6px 24px 12px;
  display: flex;
  align-items: center;
  font-size: var(--theme-mini, var(--default-theme-mini));
  text-decoration: none;
  color: var(
    --sidebar-color-2,
    var(
      --default-sidebar-color-2,
      var(--theme-color-2, var(--default-theme-color-2))
    )
  );
}
.darklight-reference-promo:hover {
  text-decoration: underline;
}
</style>
../hooks/useDarkModeState
