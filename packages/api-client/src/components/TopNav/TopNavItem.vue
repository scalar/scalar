<script setup lang="ts">
import {
  ScalarContextMenu,
  ScalarDropdownButton,
  ScalarDropdownDivider,
  ScalarDropdownMenu,
  ScalarFloating,
  ScalarHotkey,
  ScalarIconLegacyAdapter,
  ScalarTooltip,
  type Icon,
} from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import { ScalarIconLink, ScalarIconPlus, ScalarIconX } from '@scalar/icons'
import { LibraryIcon } from '@scalar/icons/library'
import type { Component } from 'vue'

defineProps<{
  hotkey?: string
  active: boolean
  label: string
  icon: Component | Icon
  isCollection?: boolean
}>()

defineEmits<{
  (e: 'click'): void
  (e: 'newTab'): void
  (e: 'close'): void
  (e: 'copyUrl'): void
  (e: 'closeOtherTabs'): void
}>()
</script>

<template>
  <ScalarContextMenu triggerClass="overflow-hidden w-full">
    <template #trigger>
      <ScalarTooltip
        :content="`${isMacOS() ? '⌘' : '^'} ${hotkey}`"
        placement="bottom">
        <div
          class="nav-item app-no-drag-region"
          :class="{ 'nav-item__active': active }"
          @click="$emit('click')">
          <div
            class="nav-item-icon-copy flex flex-1 items-center justify-center gap-1.5">
            <LibraryIcon
              v-if="isCollection"
              class="size-3.5 min-w-3.5 stroke-2"
              :src="icon as string" />
            <ScalarIconLegacyAdapter
              v-else-if="typeof icon === 'string'"
              :icon="icon"
              size="xs"
              weight="bold" />
            <component
              :is="icon"
              v-else
              size="xs"
              weight="bold" />
            <span class="custom-scroll nav-item-copy text-sm">{{ label }}</span>
          </div>
          <button
            class="nav-item-close"
            type="button"
            @click="$emit('close')">
            <ScalarIconX weight="light" />
          </button>
        </div>
      </ScalarTooltip>
    </template>
    <template #content>
      <ScalarFloating placement="right-start">
        <template #floating>
          <ScalarDropdownMenu class="scalar-app scalar-client">
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('newTab')">
              <ScalarIconPlus
                size="sm"
                weight="light" />
              New Tab
              <ScalarHotkey
                class="bg-b-2 ml-auto"
                hotkey="T" />
            </ScalarDropdownButton>
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('copyUrl')">
              <ScalarIconLink
                size="sm"
                weight="light" />
              Copy URL
            </ScalarDropdownButton>
            <ScalarDropdownDivider />
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('close')">
              <ScalarIconX
                size="sm"
                weight="light" />
              Close Tab
              <ScalarHotkey
                class="bg-b-2 ml-auto"
                hotkey="W" />
            </ScalarDropdownButton>
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('closeOtherTabs')">
              <ScalarIconX
                size="sm"
                weight="light" />
              Close Other Tabs
            </ScalarDropdownButton>
          </ScalarDropdownMenu>
        </template>
      </ScalarFloating>
    </template>
  </ScalarContextMenu>
</template>

<style scoped>
.nav-item {
  padding: 0 1rem;
  cursor: pointer;
  flex: 1;
  justify-content: center;
  align-items: center;
  display: flex;
  border-radius: var(--scalar-radius-lg);
  background: var(--scalar-background-3);
  border: var(--scalar-border-width) solid var(--scalar-background-2);
  color: var(--scalar-color-3);
  padding: 4.5px;
  min-width: 0;
  overflow: hidden;
  position: relative;
}
.dark-mode .nav-item {
  background: color-mix(in srgb, var(--scalar-background-2), transparent);
}
.nav-item-icon-copy {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  mask-image: linear-gradient(
    to left,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
.nav-item:hover .nav-item-icon-copy {
  mask-image: linear-gradient(
    to left,
    transparent 20px,
    var(--scalar-background-2) 40px
  );
}
.nav-item-copy {
  max-width: calc(100% - 20px);
}
.nav-item:hover {
  color: var(--scalar-color-1);
}
.nav-item__active {
  background-color: var(--scalar-background-1);
  color: var(--scalar-color-1);
  border-color: var(--scalar-border-color);
}
.dark-mode .nav-item__active {
  background-color: var(--scalar-background-2);
}
.nav-item-close {
  position: absolute;
  right: 3px;
  padding: 2px;
  border-radius: var(--scalar-radius);
  background: transparent;
  max-width: 20px;
  stroke-width: 1.5px;
  color: var(--scalar-color-3);
  margin-left: -20px;
  opacity: 0;
}
.nav-item:hover .nav-item-close {
  opacity: 1;
}
.nav-item-close:hover {
  background-color: var(--scalar-background-4);
}
.nav-item__active .nav-item-close:hover {
  background-color: var(--scalar-background-2);
}
</style>
