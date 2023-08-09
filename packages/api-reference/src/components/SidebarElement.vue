<script setup lang="ts">
import { computed } from 'vue'

import FlowIconButton from '../components/FlowIconButton.vue'
import { FlowIcon, Icon } from './Icon'

const props = defineProps<{
  item: {
    uid: string
    title: string
    type: 'Page' | 'Folder' | 'Link'
    link?: string
    icon?: {
      src: string
    }
  }
  isActive?: boolean
  hasChildren?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'toggleOpen'): void
}>()

enum ElementType {
  Page = 'Page',
  Folder = 'Folder',
  Link = 'Link',
}

const linkProps = computed(() => {
  const item = props.item
  if (item.type === ElementType.Link) {
    return {
      href: item.link,
      rel: 'noopener noreferrer',
      target: '_blank',
    }
  }

  return {}
})

function handleClick() {
  if (props.item.type === ElementType.Link) return

  if (props.item.type === ElementType.Folder) {
    emit('toggleOpen')
    return
  }

  emit('select')
}

function handleToggleOpen() {
  // Allow bubbled event to trigger folder open
  if (props.item.type === ElementType.Folder) return

  emit('toggleOpen')
}
</script>
<template>
  <li class="sidebar-group-item">
    <div
      class="sidebar-heading"
      :class="{ active_page: isActive }"
      @click="handleClick">
      <!-- If children are detected then show the nesting icon -->
      <FlowIconButton
        v-if="hasChildren || item.type === ElementType.Folder"
        class="toggle-nested-icon"
        :icon="open ? 'ChevronDown' : 'ChevronRight'"
        label="Toggle group"
        variant="text"
        width="20px"
        @click="handleToggleOpen" />
      <a
        class="flex-1 sidebar-heading-link"
        v-bind="linkProps">
        <ProjectIcon
          v-if="item?.icon?.src"
          class="sidebar-icon"
          :src="item.icon.src" />
        <p>{{ item.title }}</p>
      </a>
      <FlowIcon
        v-if="item?.type === ElementType.Link"
        class="link-icon"
        icon="ExternalLink"
        width="16px" />
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
  color: var(
    --scalar-api-reference-sidebar-color-1,
    var(--scalar-api-reference-theme-color-1)
  );
  background: var(
    --scalar-api-reference-sidebar-item-hover-background,
    var(--scalar-api-reference-theme-background-3)
  );
}
</style>
