<script setup lang="ts">
import { ScalarIcon, ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

import { Icon } from './Icon'

const props = defineProps<{
  item: {
    uid: string
    title: string
    type: 'Page' | 'Folder' | 'Link'
    link?: string
    icon?: {
      src: string
    }
    httpVerb?: string
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
        'sidebar-group-item__folder':
          hasChildren || item.type === ElementType.Folder,
        'active_page': isActive,
      }"
      @click="handleClick">
      <!-- If children are detected then show the nesting icon -->
      <ScalarIconButton
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
      <ScalarIcon
        v-if="item?.type === ElementType.Link"
        class="link-icon"
        name="ExternalLink"
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
  ) !important;
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
