<script setup lang="ts">
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

import { Configuration } from './Panels/Configuration'

defineProps<{
  modelValue: boolean
  configuration?: Partial<AnyApiReferenceConfiguration>
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const items = [
  // {
  //   icon: 'Terminal',
  //   label: 'Console',
  // },
  {
    icon: 'Brackets',
    label: 'Configuration',
    component: Configuration,
  },
  // {
  //   icon: 'PaintBrush',
  //   label: 'Theme',
  // },
  // {
  //   icon: 'Ship',
  //   label: 'Publish',
  // },
] as const
</script>

<template>
  <div
    class="developer-tools z-overlay"
    :class="{ 'developer-tools--open': modelValue }">
    <TabGroup>
      <!-- Content -->
      <div class="developer-tools-content">
        <TabPanels class="flex-1 overflow-auto">
          <TabPanel
            v-for="item in items"
            :key="item.label">
            <template v-if="item.component">
              <component
                :is="item.component"
                v-bind="$props" />
            </template>
            <template v-else>
              {{ item.label }}
            </template>
          </TabPanel>
        </TabPanels>
      </div>
      <!-- Tabs -->
      <div class="developer-tools-menu">
        <TabList class="flex h-full gap-1">
          <Tab
            v-for="tab in items"
            :key="tab.label"
            v-slot="{ selected }"
            as="template">
            <ScalarButton
              class="developer-tools-button"
              :class="{ 'developer-tools-button--selected': selected }">
              <ScalarIcon :icon="tab.icon" />
              {{ tab.label }}
            </ScalarButton>
          </Tab>
        </TabList>
      </div>
      <!-- Toggle -->
      <div
        class="developer-tools-toggle"
        @click="$emit('update:modelValue', !modelValue)">
        <!-- TODO: Too big -->
        <ScalarIcon icon="Terminal" />
        <ScalarIcon icon="ChevronDown" />
      </div>
    </TabGroup>
  </div>
</template>

<style scoped>
.developer-tools {
  position: fixed;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  font-size: var(--scalar-font-size-4);
  font-weight: var(--scalar-medium);
}

.developer-tools-menu {
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

.developer-tools-button {
  padding: 6px 8px;
  font-weight: var(--scalar-font-medium);
  color: var(--scalar-color-2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.developer-tools-button--selected {
  background: var(--scalar-background-2);
}

.developer-tools svg {
  width: 14px;
  height: 14px;
}

.developer-tools-button:hover {
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius);
  cursor: pointer;
}

.developer-tools-toggle {
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

.developer-tools-toggle:hover {
  background: linear-gradient(
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
}

.dark-mode .developer-tools-toggle {
  background: linear-gradient(
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
}

.dark-mode .developer-tools-toggle:hover {
  background: linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
}

.developer-tools-toggle svg:first-of-type {
  width: 20px;
  height: 20px;
}

.developer-tools-toggle svg:last-of-type {
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

  .developer-tools-menu {
    animation: fade-in auto linear both;
    animation-timeline: scroll();
    animation-range: 0% 200px;
  }
}

.developer-tools--open .developer-tools-menu,
.developer-tools:hover .developer-tools-menu {
  animation: none;
  opacity: 1;
  pointer-events: all;
}

.developer-tools-content {
  display: none;
  width: 100dvw;
  height: 350px;
  position: fixed;
  padding: 12px;
  bottom: 0;
  left: 0;
  background: color-mix(in srgb, var(--scalar-background-1) 94%, transparent);
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.developer-tools--open .developer-tools-content {
  display: block;
}
</style>
