<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'

defineProps<{
  isDarkMode: boolean
}>()

defineEmits<{
  (e: 'toggleDarkMode'): void
}>()
</script>
<template>
  <div class="darklight-reference">
    <button
      class="darklight"
      type="button"
      @click="$emit('toggleDarkMode')">
      <ScalarIcon icon="LightDarkModeToggle" />
      <template v-if="isDarkMode">
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
  font-family: var(--scalar-font);
  border: none;
  border-top: 1px solid
    var(--scalar-sidebar-border-color, var(--scalar-border-color));
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));

  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
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
  color: var(--scalar-sidebar-color-1, var(--scalar-color-1));
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
  font-size: var(--scalar-mini);
  text-decoration: none;
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
}
.darklight-reference-promo:hover {
  text-decoration: underline;
}
</style>
