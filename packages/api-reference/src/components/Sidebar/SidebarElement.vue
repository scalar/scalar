<script setup lang="ts">
import { type Icon, ScalarIcon, ScalarIconButton } from '@scalar/components'

import { scrollToId, sleep } from '../../helpers'
import { useNavState } from '../../hooks'
import SidebarHttpBadge from './SidebarHttpBadge.vue'

const props = defineProps<{
  id: string
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

const { hash, isIntersectionEnabled, pathRouting } = useNavState()

// We disable intersection observer on click
const handleClick = async () => {
  if (props.hasChildren) emit('toggleOpen')
  props.item?.select?.()

  // If the section was open, wait for a short delay before enabling intersection observer
  if (props.open) {
    isIntersectionEnabled.value = false
    await sleep(100)
  }
  isIntersectionEnabled.value = true
}

// Build relative URL and add hash
const generateLink = () => {
  if (pathRouting.value) {
    return pathRouting.value.basePath + '/' + props.item.id
  } else {
    const newUrl = new URL(window.location.href)
    newUrl.hash = props.item.id
    return `${newUrl.pathname}${newUrl.search}${newUrl.hash}`
  }
}

// For path routing we want to handle the clicks
const onAnchorClick = async (ev: Event) => {
  if (pathRouting.value) {
    ev.preventDefault()

    // Due to the prevent default
    if (props.hasChildren) emit('toggleOpen')
    props.item?.select?.()

    // Make sure to open the section
    emit('toggleOpen')

    // Disable intersection observer before we scroll
    isIntersectionEnabled.value = false

    // Manually update "hash"
    hash.value = props.item.id

    const url = new URL(window.location.href)
    url.pathname = pathRouting.value.basePath + '/' + props.item.id

    window.history.pushState({}, '', url)
    scrollToId(props.item.id)

    await sleep(100)
    isIntersectionEnabled.value = true
  }
}
</script>
<template>
  <li
    :id="id"
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
      <!-- Use &hairsp; to vertically center scalar icon button to the first line of text in the sidebar heading link -->
      <p
        v-if="hasChildren"
        class="sidebar-heading-chevron">
        <ScalarIconButton
          class="toggle-nested-icon"
          :icon="open ? 'ChevronDown' : 'ChevronRight'"
          label="Toggle group"
          size="sm"
          @click.stop="handleClick" />
        &hairsp;
      </p>
      <a
        class="sidebar-heading-link"
        :href="generateLink()"
        @click="onAnchorClick">
        <ScalarIcon
          v-if="item?.icon?.src"
          class="sidebar-icon"
          :icon="item.icon.src as Icon" />
        <p class="sidebar-heading-link-title">
          {{ item.title }}
        </p>
        <p
          v-if="item.httpVerb && !hasChildren"
          class="sidebar-heading-link-method">
          &hairsp;
          <SidebarHttpBadge
            :active="isActive"
            :method="item.httpVerb" />
        </p>
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

  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  word-break: break-word;
  line-height: 1.385;
  max-width: 100%;
  position: relative;
  cursor: pointer;
  border-radius: var(--scalar-radius);
  flex: 1;
  padding-right: 9px;
  user-select: none;
}
.sidebar-heading.deprecated .sidebar-heading-link-title {
  text-decoration: line-through;
}
.sidebar-heading:hover {
  background: var(
    --scalar-sidebar-item-hover-background,
    var(--scalar-background-2)
  );
}
.sidebar-heading:hover .sidebar-heading-link-title {
  color: var(--scalar-sidebar-item-hover-color);
}

.active_page.sidebar-heading:hover,
.active_page.sidebar-heading {
  color: var(--scalar-sidebar-color-active, var(--scalar-color-accent));

  background: var(
    --scalar-sidebar-item-active-background,
    var(--scalar-background-accent)
  );
}
.active_page.sidebar-heading:hover .sidebar-heading-link-title {
  color: var(--scalar-sidebar-color-active, var(--scalar-color-accent));
}
.sidebar-indent-nested .sidebar-indent-nested .sidebar-heading:before {
  content: '';
  position: absolute;
  top: 0;
  left: calc((var(--scalar-sidebar-level) * 12px));
  width: 1px;
  height: 100%;
  background: var(--scalar-sidebar-indent-border);
}
.sidebar-indent-nested .sidebar-indent-nested .sidebar-heading:hover:before {
  background: var(--scalar-sidebar-indent-border-hover);
}
.sidebar-indent-nested
  .sidebar-indent-nested
  .active_page.sidebar-heading:before {
  background: var(--scalar-sidebar-indent-border-active);
}

.sidebar-heading-link {
  text-decoration: none;
  color: inherit;
  padding-right: 12px;
  padding: 6px 0;
  display: flex;
  flex: 1;
  justify-content: space-between;
  gap: 2px;
}
.sidebar-heading p {
  height: fit-content;
  display: flex;
  align-items: center;
}
.sidebar-heading p:empty {
  display: none;
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
/* awkward pixel value to deal with hairspace alignment across browser*/
.sidebar-heading-chevron {
  margin: 5px -5.5px 5px -9px;
}
.toggle-nested-icon {
  border: none;
  color: currentColor;
  padding: 3px;
  color: var(--scalar-sidebar-color-2);
}
.active_page .toggle-nested-icon {
  color: var(--scalar-sidebar-color-active, var(--scalar-color-accent));
}

.toggle-nested-icon:hover,
.toggle-nested-icon:focus-visible {
  color: currentColor;
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
  color: var(--scalar-sidebar-color-1, var(--scalar-color-1));
  background: var(
    --scalar-sidebar-item-hover-background,
    var(--scalar-background-2)
  );
}
.sidebar-group-item__folder {
  color: var(--scalar-sidebar-color-1, var(--scalar-color-1));
}
</style>
