<script setup lang="ts">
import {
  ScalarContextMenu,
  ScalarDropdownButton,
  ScalarDropdownDivider,
  ScalarDropdownMenu,
  ScalarFloating,
  ScalarHotkey,
  ScalarIcon,
  ScalarTooltip,
} from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import { LibraryIcon } from '@scalar/icons/library'
import type { XScalarTabs } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'
import { computed } from 'vue'

const { hotkey, active, tab } = defineProps<{
  /** Optional keyboard shortcut number for the tab */
  hotkey?: string
  /** Whether this tab is currently active */
  active: boolean

  tab: NonNullable<XScalarTabs['x-scalar-tabs']>[number]
}>()

const emit = defineEmits<{
  /** Fired when the tab is clicked to activate it */
  (e: 'click'): void
  /** Fired when the close button is clicked */
  (e: 'close'): void
  /** Fired when "New Tab" is selected from context menu */
  (e: 'newTab'): void
  /** Fired when "Copy URL" is selected from context menu */
  (e: 'copyUrl'): void
  /** Fired when "Close Other Tabs" is selected from context menu */
  (e: 'closeOtherTabs'): void
}>()

/** Display the appropriate modifier key based on the operating system */
const modifierKey = computed(() => (isMacOS() ? '⌘' : '^'))

/** The tooltip content showing the keyboard shortcut */
const tooltipContent = computed(() =>
  hotkey ? `${modifierKey.value} ${hotkey}` : '',
)

/**
 * Handle the close button click.
 * We stop propagation to prevent triggering the tab activation click.
 */
const handleClose = (event: MouseEvent): void => {
  event.stopPropagation()
  emit('close')
}
</script>

<template>
  <!-- Context menu wrapper provides right-click menu functionality -->
  <ScalarContextMenu triggerClass="overflow-hidden w-full flex-1">
    <!-- Tab button trigger with tooltip showing keyboard shortcut -->
    <template #trigger>
      <ScalarTooltip
        :content="tooltipContent"
        placement="bottom">
        <!-- Main tab container - clickable area to activate the tab -->
        <div
          class="nav-item app-no-drag-region"
          :class="{ 'nav-item__active': active }"
          @click="emit('click')">
          <!-- Icon and label container with gradient mask for text overflow -->
          <div
            class="nav-item-icon-copy flex flex-1 items-center justify-center gap-1.5">
            <LibraryIcon
              v-if="tab.icon"
              class="text-c-2 size-5"
              :src="tab.icon"
              stroke-width="2" />
            <span class="custom-scroll nav-item-copy text-sm">{{
              tab.title
            }}</span>
          </div>

          <!-- Close button - appears on hover, stops propagation to prevent tab activation -->
          <button
            class="nav-item-close"
            type="button"
            @click="handleClose">
            <ScalarIcon
              icon="Close"
              thickness="1.75" />
          </button>
        </div>
      </ScalarTooltip>
    </template>

    <!-- Context menu content shown on right-click -->
    <template #content>
      <ScalarFloating placement="right-start">
        <template #floating>
          <ScalarDropdownMenu class="scalar-app scalar-client">
            <!-- New Tab action (Cmd/Ctrl + T) -->
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="emit('newTab')">
              <ScalarIcon
                icon="AddTab"
                size="sm"
                thickness="1.5" />
              New Tab
              <ScalarHotkey
                class="bg-b-2 ml-auto"
                hotkey="T" />
            </ScalarDropdownButton>

            <!-- Copy URL action -->
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="emit('copyUrl')">
              <ScalarIcon
                icon="Link"
                size="sm"
                thickness="1.5" />
              Copy URL
            </ScalarDropdownButton>

            <ScalarDropdownDivider />

            <!-- Close Tab action (Cmd/Ctrl + W) -->
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="emit('close')">
              <ScalarIcon
                icon="CloseTab"
                size="sm"
                thickness="1.5" />
              Close Tab
              <ScalarHotkey
                class="bg-b-2 ml-auto"
                hotkey="W" />
            </ScalarDropdownButton>

            <!-- Close Other Tabs action -->
            <ScalarDropdownButton
              class="flex items-center gap-1.5"
              @click="emit('closeOtherTabs')">
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
/** Base tab styling with subtle background and border */
.nav-item {
  padding: 4.5px 1rem;
  cursor: pointer;
  flex: 1;
  justify-content: center;
  align-items: center;
  display: flex;
  border-radius: var(--scalar-radius-lg);
  background: var(--scalar-background-3);
  border: var(--scalar-border-width) solid var(--scalar-background-2);
  color: var(--scalar-color-3);
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.dark-mode .nav-item {
  background: color-mix(in srgb, var(--scalar-background-2), transparent);
}

/**
 * Container for the icon and label.
 * Uses a mask gradient to fade out text on the right side,
 * making room for the close button that appears on hover.
 */
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

/** On hover, shift the gradient to make more room for the close button */
.nav-item:hover .nav-item-icon-copy {
  mask-image: linear-gradient(
    to left,
    transparent 20px,
    var(--scalar-background-2) 40px
  );
}

/** Label text with constrained width to prevent overflow */
.nav-item-copy {
  max-width: calc(100% - 20px);
}

.nav-item:hover {
  color: var(--scalar-color-1);
}

/** Active tab state with brighter background and border */
.nav-item__active {
  background-color: var(--scalar-background-1);
  color: var(--scalar-color-1);
  border-color: var(--scalar-border-color);
}

.dark-mode .nav-item__active {
  background-color: var(--scalar-background-2);
}

/**
 * Close button positioned absolutely on the right.
 * Hidden by default, revealed on tab hover.
 */
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
