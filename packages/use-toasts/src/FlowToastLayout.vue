<script setup lang="ts">
import type { ToastStatus } from './FlowToast'

defineProps<{
  status?: ToastStatus
}>()
</script>
<template>
  <div
    class="toast-layout"
    :class="{ 'toast-error': status === 'Error' }">
    <div
      v-if="$slots.icon"
      class="toast-icon">
      <slot name="icon" />
    </div>
    <div class="toast-title">
      <slot name="title" />
    </div>
    <div
      v-if="$slots.description"
      class="toast-description text-copy-light">
      <slot name="description" />
    </div>
    <div
      v-if="$slots.timeout"
      class="toast-timeout">
      <slot name="timeout" />
    </div>
  </div>
</template>
<style scoped>
.toast-layout {
  pointer-events: initial;

  padding: 18px;
  background: var(--theme-background-1);
  border-radius: var(--theme-radius-lg);
  font-size: var(--theme-font-size-3);
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    'icon title timeout'
    '. description description';
  align-items: center;
  position: relative;

  width: 380px;
}

.toast-title {
  grid-area: title;
  font-weight: var(--theme-font-medium);
  display: flex;
  align-items: center;
}
.toast-description {
  grid-area: description;
  margin-top: 5px;
  line-height: 1.45;
  color: var(--theme-color-2);
}
.toast-icon {
  grid-area: icon;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: var(--theme-color-2);
}
.toast-icon > :deep(*) {
  width: 14px;
  height: 14px;
}
.toast-timeout {
  grid-area: timeout;
  margin-left: 10px;
  width: 16px;
  height: 16px;
  display: flex;
  color: var(--theme-color-ghost);
}

.toast-error .toast-icon,
.toast-error .toast-title {
  color: var(--theme-error-color);
}
</style>
