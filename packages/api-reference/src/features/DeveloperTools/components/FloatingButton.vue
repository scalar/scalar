<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const tabs = [
  {
    icon: 'Terminal',
    label: 'Console',
  },
  {
    icon: 'Brackets',
    label: 'Configuration',
  },
  {
    icon: 'PaintBrush',
    label: 'Theme',
  },
  {
    icon: 'Ship',
    label: 'Publish',
  },
] as const
</script>

<template>
  <div
    class="dev-mode-toggle z-overlay"
    :class="{ 'dev-mode-toggle__open': modelValue }">
    <div class="dev-mode-toggle-edit"></div>
    <div class="dev-mode-toggle-menu">
      <span
        v-for="tab in tabs"
        :key="tab.label"
        class="dev-mode-toggle-button"
        @click="$emit('update:modelValue', true)">
        <!-- dev-mode-toggle-button__active -->
        <ScalarIcon :icon="tab.icon" />
        {{ tab.label }}
      </span>
    </div>
    <div
      class="dev-mode-toggle-flip"
      @click="$emit('update:modelValue', !modelValue)">
      <ScalarIcon icon="Terminal" />
      <svg
        class="scalar-icon ml-1 size-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="m18 10-6 6-6-6"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.dev-mode-toggle {
  position: fixed;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  font-size: var(--scalar-font-size-4);
  font-weight: var(--scalar-medium);
}
.dev-mode-toggle-menu {
  border-radius: var(--scalar-radius-lg);
  padding: 4px 4px 4px 4px;
  background: color-mix(in srgb, var(--scalar-background-1) 94%, transparent);
  backdrop-filter: blur(2px);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  display: flex;
  align-items: center;
  position: absolute;
  right: -4px;
  bottom: -4px;
  padding-right: 60px;
  opacity: 0;
  transform: scale(1);
  transition: opacity 0.3s ease-in-out;
}
.dev-mode-toggle-button {
  padding: 6px 8px;
  font-weight: var(--scalar-font-medium);
  color: var(--scalar-color-2);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dev-mode-toggle-button__active {
  background: var(--scalar-background-2);
}
.dev-mode-toggle svg {
  width: 14px;
  height: 14px;
}
.dev-mode-toggle-button:hover {
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius);
  cursor: pointer;
}
.dev-mode-toggle-flip {
  background: linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-2)
  );

  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  color: var(--scalar-color-2);
  padding: 4px;
  cursor: pointer;
  margin-left: 4px;
  display: flex;
  align-items: center;
  z-index: 1;
}
.dev-mode-toggle-flip:hover {
  background: linear-gradient(
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
}
.dark-mode .dev-mode-toggle-flip {
  background: linear-gradient(
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
}
.dark-mode .dev-mode-toggle-flip:hover {
  background: linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
}
.dev-mode-toggle-flip svg:first-of-type {
  width: 20px;
  height: 20px;
}
.dev-mode-toggle-flip svg:last-of-type {
  stroke-width: 2px;
}

@supports (animation-timeline: view()) {
  @keyframes fade-in {
    0% {
      opacity: 1;
    }
    85% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: scale(0.98);
      pointer-events: none;
    }
  }

  .dev-mode-toggle-menu {
    animation: fade-in auto linear both;
    animation-timeline: scroll();
    animation-range: 0% 200px;
  }
}
.dev-mode-toggle__open .dev-mode-toggle-menu,
.dev-mode-toggle:hover .dev-mode-toggle-menu {
  animation: none;
  opacity: 1;
  pointer-events: all;
}
.dev-mode-toggle-edit {
  display: none;
  width: 100dvw;
  height: 350px;
  position: fixed;
  bottom: 0;
  left: 0;
  background: color-mix(in srgb, var(--scalar-background-1) 94%, transparent);
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
.dev-mode-toggle__open .dev-mode-toggle-edit {
  display: block;
}
</style>
