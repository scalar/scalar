<script setup lang="ts">
import {
  ScalarContextMenu,
  ScalarDropdownButton,
  ScalarDropdownDivider,
  ScalarDropdownMenu,
  ScalarFloating,
  ScalarIcon,
  ScalarTooltip,
  type Icon,
} from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import { LibraryIcon } from '@scalar/icons/library'

import ScalarHotkey from '@/components/ScalarHotkey.vue'

defineProps<{
  hotkey?: string
  active: boolean
  label: string
  icon: Icon
  isCollection?: boolean
}>()

defineEmits<{
  (e: 'click'): void
  (e: 'close'): void
  (e: 'newTab'): void
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
              :src="icon" />
            <ScalarIcon
              v-else
              :icon="icon"
              size="xs"
              thickness="2.5" />
            <span class="custom-scroll nav-item-copy text-sm">{{ label }}</span>
          </div>
          <button
            class="nav-item-close"
            type="button"
            @click="$emit('close')">
            <ScalarIcon
              icon="Close"
              thickness="1.75" />
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
              <ScalarIcon
                icon="AddTab"
                size="sm"
                thickness="1.5" />
              New Tab
              <ScalarHotkey
                class="bg-b-2 ml-auto"
                hotkey="T" />
            </ScalarDropdownButton>
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('copyUrl')">
              <ScalarIcon
                icon="Link"
                size="sm"
                thickness="1.5" />
              Copy URL
            </ScalarDropdownButton>
            <ScalarDropdownDivider />
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('close')">
              <ScalarIcon
                icon="CloseTab"
                size="sm"
                thickness="1.5" />
              Close Tab
              <ScalarHotkey
                class="bg-b-2 ml-auto"
                hotkey="W" />
            </ScalarDropdownButton>
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="$emit('closeOtherTabs')">
              <ScalarIcon
                icon="CloseTabs"
                size="sm"
                thickness="1.5" />
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
