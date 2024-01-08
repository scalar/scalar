<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { ref } from 'vue'

import { sleep } from '../helpers'
import { useNavState } from '../hooks'
import { Icon } from './Icon'

const props = defineProps<{
  item: {
    id: string
    title: string
    select?: () => void
    link?: string
    icon?: {
      src: string
    }
    httpVerb?: string
    deprecated?: boolean
  }
  isActive?: boolean
  hasChildren?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleOpen'): void
}>()

const { isIntersectionEnabled } = useNavState()

// We disable intersection observer on click
const handleClick = async () => {
  isIntersectionEnabled.value = false
  if (props.hasChildren) emit('toggleOpen')
  props.item?.select?.()

  await sleep(100)
  isIntersectionEnabled.value = true
}

// Ensure we expose the root element
const el = ref<HTMLElement | null>(null)
defineExpose({ el })
</script>
<template>
  <li
    ref="el"
    class="sidebar-group-item">
    <div
      class="sidebar-heading"
      :class="{
        'sidebar-group-item__folder': hasChildren,
        'active_page': isActive,
        'deprecated': item.deprecated ?? false,
      }"
      @click="handleClick">
      <!-- If children are detected then show the nesting icon -->
      <ScalarIconButton
        v-if="hasChildren"
        class="toggle-nested-icon"
        :icon="open ? 'ChevronDown' : 'ChevronRight'"
        label="Toggle group"
        size="sm"
        @click="handleClick" />
      <a
        class="sidebar-heading-link"
        :href="`#${item.id}`">
        <Icon
          v-if="item?.icon?.src"
          class="sidebar-icon"
          :src="item.icon.src" />
        <p>{{ item.title }}</p>
        <div
          v-if="item.httpVerb"
          class="sidebar-heading-type"
          :class="[
            item.httpVerb ? `sidebar-heading-type--${item.httpVerb}` : '',
          ]">
          {{ item.httpVerb }}
        </div>
      </a>
    </div>
    <slot v-if="open" />
    <div
      v-if="$slots['action-menu']"
      class="action-menu">
      <slot name="action-menu"></slot>
    </div>
  </li>
</template>
<style scoped>
.sidebar-heading {
  display: flex;
  gap: 6px;

  /* prettier-ignore */
  color: var(--sidebar-color-2, var(--default-theme-color-2, var(--theme-color-2, var(--default-theme-color-2))));
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  word-break: break-word;
  line-height: 1.385;
  align-items: center;
  max-width: 100%;
  position: relative;
  cursor: pointer;
  border-radius: 0 var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius)) 0;
  flex: 1;
  padding-right: 12px;
  user-select: none;
}
.sidebar-heading.deprecated p {
  text-decoration: line-through;
}
.sidebar-heading:hover {
  /* prettier-ignore */
  background: var(--sidebar-item-hover-background, var(--default-sidebar-item-hover-background, var(--theme-background-2, var(--default-theme-background-2))));
}
.sidebar-heading:hover p {
  color: var(
    --sidebar-item-hover-color,
    var(
      --default-sidebar-item-hover-color,
      var(--theme-color-accent, var(--default-theme-color-accent))
    )
  );
}

.active_page.sidebar-heading:hover,
.active_page.sidebar-heading {
  /* prettier-ignore */
  color: var(--sidebar-color-active, var(--default-sidebar-color-active, var(--theme-color-accent, var(--default-theme-color-accent))));
  /* prettier-ignore */
  background: var(--sidebar-item-active-background, var(--default-sidebar-item-active-background, var(--theme-background-accent, var(--default-theme-background-accent))));
}
.sidebar-heading-link {
  text-decoration: none;
  color: inherit;
  padding-right: 12px;
  padding: 6px 0;
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: flex-start;
}

/* Sidebar link icon */
.link-icon {
  position: relative;
  left: 4px;
}

.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;

  width: 13px;
  height: 13px;
}

.sidebar-icon > svg {
  width: 13px;
  height: 13px;
}

.sidebar-group-item {
  position: relative;
}

/* Folder/page collapse icon */
.toggle-nested-icon {
  border: none;
  position: absolute;
  color: currentColor;
}

.toggle-nested-icon:hover,
.toggle-nested-icon:focus-visible {
  color: currentColor;
  filter: drop-shadow(0 0.125px 0 currentColor)
    drop-shadow(0 -0.125px 0 currentColor);
}

.action-menu {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 6px;
}
/**
* Some awkwardness to make the dropdown buttons hidden when not hovered
* but still show when the panel is open and focused
*/
.action-menu :deep(.button-wrapper button) {
  /* Hide the icons by default */
  opacity: 0;
  width: 20px;
  height: 20px;
  padding: 4px;
}
.action-menu:hover :deep(.button-wrapper button),
.action-menu :deep(.button-wrapper button:hover),
.sidebar-heading:hover ~ .action-menu :deep(.button-wrapper button),
.action-menu :deep(.button-wrapper button[aria-expanded='true']) {
  opacity: 1;
}
.sidebar-heading:has(~ .action-menu:hover) {
  /* prettier-ignore */
  color: var(--sidebar-color-1, var(--default-sidebar-color-1), var(--theme-color-1, var(--default-theme-color-1)));
  /* prettier-ignore */
  background: var(--sidebar-item-hover-background, var(--default-sidebar-item-hover-background), var(--theme-background-2, var(--default-theme-background-2)));
}

.sidebar-heading-type {
  width: 28px;
  height: 12px;
  line-height: 13px;
  top: 3.5px;
  margin-left: 2px;
  border-radius: 30px;
  flex-shrink: 0;
  color: var(
    --sidebar-background-1,
    var(
      --default-sidebar-background-1,
      var(--theme-background-1, var(--default-theme-background-1))
    )
  );
  font-size: 0px;
  font-weight: bold;
  text-align: center;
  position: relative;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.active_page .sidebar-heading-type {
  background: transparent;
  box-shadow: inset 0 0 0 1px
    var(
      --sidebar-color-active,
      var(
        --default-sidebar-color-active,
        var(--theme-color-accent, var(--default-theme-color-accent))
      )
    );
  color: var(
    --sidebar-color-active,
    var(
      --default-sidebar-color-active,
      var(--theme-color-accent, var(--default-theme-color-accent))
    )
  );
}
.sidebar-group-item__folder .sidebar-heading-type {
  display: none;
}
.sidebar-heading-type:before {
  font-size: 8px;
}
.sidebar-heading-type--post {
  background: var(--theme-color-green, var(--default-theme-color-green));
}
.sidebar-heading-type--post:before {
  content: 'POST';
}
.sidebar-heading-type--delete {
  background: var(--theme-color-red, var(--default-theme-color-red));
}
.sidebar-heading-type--delete:before {
  content: 'DEL';
}
.sidebar-heading-type--patch {
  background: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.sidebar-heading-type--patch:before {
  content: 'PATCH';
}
.sidebar-heading-type--get {
  background: var(--theme-color-blue, var(--default-theme-color-blue));
}
.sidebar-heading-type--get:before {
  content: 'GET';
}
.sidebar-heading-type--put {
  background: var(--theme-color-orange, var(--default-theme-color-orange));
}
.sidebar-heading-type--put:before {
  content: 'PUT';
}
</style>
