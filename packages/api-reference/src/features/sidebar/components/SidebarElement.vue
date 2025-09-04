<script setup lang="ts">
import { ScalarSidebarGroupToggle } from '@scalar/components'
import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { sleep } from '@scalar/helpers/testing/sleep'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import {
  combineUrlAndPath,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1, XScalarStability } from '@scalar/types'

import type { TraversedEntry } from '@/features/traverse-schema'
import { useConfig } from '@/hooks/useConfig'
import { useNavState } from '@/hooks/useNavState'

import SidebarHttpBadge from './SidebarHttpBadge.vue'

const props = defineProps<{
  id: string
  item: TraversedEntry
  isActive?: boolean
  hasChildren?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleOpen'): void
}>()

const { getFullHash, isIntersectionEnabled, replaceUrlState } = useNavState()

const config = useConfig()

const getPathOrTitle = (item: TraversedEntry): string => {
  if ('path' in item) {
    // Insert zero-width space after every slash, to give line-break opportunity.
    return item.path.replace(/\//g, '/\u200B')
  }
  return item.title
}

// We disable intersection observer on click
const handleClick = async () => {
  // wait for a short delay before enabling intersection observer
  isIntersectionEnabled.value = false

  if (props.hasChildren) {
    emit('toggleOpen')
  }

  // Re-enable intersection observer
  await sleep(100)
  isIntersectionEnabled.value = true
}

// Build relative URL and add hash
const generateLink = () => {
  if (config.value.pathRouting) {
    return combineUrlAndPath(config.value.pathRouting.basePath, props.item.id)
  }
  if (typeof window !== 'undefined') {
    const newUrl = new URL(window.location.href)
    newUrl.hash = getFullHash(props.item.id)
    return `${newUrl.search}${newUrl.hash}`
  }

  return `#${getFullHash(props.item.id)}`
}

// For path routing we want to handle the clicks
const onAnchorClick = async (ev: Event) => {
  config.value.onSidebarClick?.(props.item.id)

  if (config.value.pathRouting) {
    ev.preventDefault()

    // Due to the prevent default
    if (props.hasChildren) {
      emit('toggleOpen')
    }

    // Make sure to open the section
    emit('toggleOpen')

    // Disable intersection observer before we scroll
    isIntersectionEnabled.value = false

    replaceUrlState(props.item.id)
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
        'deprecated':
          'operation' in item &&
          isOperationDeprecated(
            item.operation as OpenAPIV3_1.OperationObject<{
              'x-scalar-stability': XScalarStability
            }>,
          ),
      }"
      @click="handleClick">
      <!-- If children are detected then show the nesting icon -->
      <!-- Use &hairsp; to vertically center scalar icon button to the first line of text in the sidebar heading link -->
      <p
        v-if="hasChildren && !config.defaultOpenAllTags"
        class="sidebar-heading-chevron">
        <button
          :aria-expanded="open"
          class="toggle-nested-icon"
          type="button"
          @click.stop="handleClick">
          <ScalarSidebarGroupToggle :open="open">
            <template #label>
              {{ open ? 'Collapse' : 'Expand' }} {{ item.title }}
            </template>
          </ScalarSidebarGroupToggle>
        </button>
        &hairsp;
      </p>
      <a
        class="sidebar-heading-link"
        :href="generateLink()"
        :tabindex="hasChildren ? -1 : 0"
        @click="onAnchorClick">
        <p class="sidebar-heading-link-title">
          <span
            v-if="config.operationTitleSource === 'path'"
            class="hanging-indent">
            {{ getPathOrTitle(item) }}
          </span>
          <span v-else>
            {{ item.title }}
          </span>
        </p>
        <p
          v-if="'method' in item && !hasChildren"
          class="sidebar-heading-link-method">
          &hairsp;
          <span class="sr-only">HTTP Method:&nbsp;</span>
          <SidebarHttpBadge
            :active="isActive"
            class="min-w-9.75 justify-end text-right"
            :method="item.method">
            <template #default>
              <ScalarIconWebhooksLogo
                v-if="'webhook' in item"
                :style="{
                  color: getHttpMethodInfo(item.method).colorVar,
                }"
                weight="bold" />
            </template>
          </SidebarHttpBadge>
        </p>
      </a>
    </div>
    <slot v-if="open" />
    <div
      v-if="$slots['action-menu']"
      class="action-menu">
      <slot name="action-menu" />
    </div>
  </li>
</template>
<style scoped>
.sidebar-heading {
  display: flex;
  gap: 4px;

  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
  font-size: var(--scalar-small);
  font-weight: var(--scalar-sidebar-font-weight, var(--scalar-regular));
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
.sidebar-heading-link-method {
  margin: 0;
}
.sidebar-heading.deprecated .sidebar-heading-link-title {
  text-decoration: line-through;
}
.sidebar-heading-link-title {
  margin: 0;
}

.sidebar-heading-link-title .hanging-indent {
  padding-left: 0.7em;
  text-indent: -0.7em;
  overflow-wrap: break-word;
  word-wrap: break-word;
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

.sidebar-heading-link:focus-visible {
  outline: none;
}

.sidebar-heading:has(> .sidebar-heading-link:focus-visible) {
  z-index: 1;
  outline: 1px solid var(--scalar-color-accent);
}

.active_page.sidebar-heading:hover,
.active_page.sidebar-heading {
  color: var(--scalar-sidebar-color-active, var(--scalar-color-accent));

  background: var(
    --scalar-sidebar-item-active-background,
    var(--scalar-background-accent)
  );
}
.active_page.sidebar-heading p {
  font-weight: var(--scalar-sidebar-font-weight-active, var(--scalar-semibold));
}
.active_page.sidebar-heading:hover .sidebar-heading-link-title {
  color: var(--scalar-sidebar-color-active, var(--scalar-color-accent));
}
.sidebar-indent-nested .sidebar-indent-nested .sidebar-heading:before {
  content: '';
  position: absolute;
  top: 0;
  left: calc((var(--scalar-sidebar-level) * 15.5px));
  width: var(--scalar-border-width);
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
  font-weight: var(--scalar-sidebar-font-weight, var(--scalar-regular));
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
  margin: 6px 0;
  width: 16px;
}
.sidebar-heading-chevron .toggle-nested-icon:focus-visible {
  outline: none;
}
.sidebar-heading:has(
    .sidebar-heading-chevron .toggle-nested-icon:focus-visible
  ) {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--scalar-color-accent);
}
.toggle-nested-icon {
  color: var(--scalar-color-3);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
  text-transform: var(--scalar-tag-text-transform, initial);
}
.sidebar-group-item__folder:has(~ ul .sidebar-heading.active_page) {
  --scalar-sidebar-font-weight: var(--scalar-sidebar-font-weight-active);
  color: var(--scalar-sidebar-color-1, var(--scalar-color-1));
  font-weight: var(--scalar-sidebar-font-weight-active, var(--scalar-semibold));
}
</style>
