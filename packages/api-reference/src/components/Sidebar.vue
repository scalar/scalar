<script setup lang="ts">
import {
  generateRequest,
  useApiClientRequestStore,
  useApiClientStore,
  useOperation,
} from '@scalar/api-client'
import { useKeyboardEvent } from '@scalar/use-keyboard-event'
import { useMediaQuery } from '@vueuse/core'

import { useTemplateStore } from '../stores/template'
import type { Operation, Spec } from '../types'
import FindAnythingButton from './FindAnythingButton.vue'
import SidebarElement from './SidebarElement.vue'
import SidebarGroup from './SidebarGroup.vue'

const props = defineProps<{ spec: Spec }>()

const { state, setActiveSidebar, toggleApiClient } = useApiClientStore()

const { setActiveRequest } = useApiClientRequestStore()

function showItemInClient(operation: Operation) {
  const { parameterMap } = useOperation({ operation })
  const item = generateRequest(
    operation,
    parameterMap.value,
    props.spec.servers[0],
  )
  setActiveRequest(item)
  toggleApiClient(item, true)
}

const scrollToEndpoint = (item: Operation) => {
  setActiveSidebar(item.operationId)
  if (state.showApiClient) {
    showItemInClient(item)
  }
  document.getElementById(`endpoint/${item.operationId}`)?.scrollIntoView()
}

const isMobile = useMediaQuery('(max-width: 1000px)')

const {
  state: templateState,
  setItem: setTemplateItem,
  toggleCollapsedSidebarItem,
  setCollapsedSidebarItem,
} = useTemplateStore()

useKeyboardEvent({
  keyList: ['k'],
  withCtrlCmd: true,
  handler: () => setTemplateItem('showSearch', !templateState.showSearch),
})
</script>
<template>
  <div class="sidebar">
    <FindAnythingButton
      v-if="!isMobile"
      @click="setTemplateItem('showSearch', true)" />
    <div class="pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <template v-for="tag in spec.tags">
          <SidebarElement
            v-if="tag.operations?.length > 0"
            :key="tag.name"
            :hasChildren="true"
            :isActive="false"
            :item="{
              uid: '',
              title: tag.name.toUpperCase(),
              type: 'Folder',
            }"
            :open="templateState.collapsedSidebarItems[tag.name]"
            @select="() => toggleCollapsedSidebarItem(tag.name)"
            @toggleOpen="toggleCollapsedSidebarItem(tag.name)">
            <SidebarGroup :level="0">
              <SidebarElement
                v-for="operation in tag.operations"
                :key="operation.operationId"
                :isActive="state.activeSidebar === operation.operationId"
                :item="{
                  uid: '',
                  title: operation.name || operation.path,
                  type: 'Page',
                }"
                @select="
                  () => {
                    setCollapsedSidebarItem(tag.name, true)
                    scrollToEndpoint(operation)
                  }
                " />
            </SidebarGroup>
          </SidebarElement>
        </template>
      </SidebarGroup>
    </div>
  </div>
</template>

<style>
.sidebar {
  --theme-sidebar-indent-base: 6px;
  /* prettier-ignore */
  background: var(--sidebar-background-1, var(--theme-background-1));
}

/* ----------------------------------------------------- */
/* Main sidebar styles */

.sidebar {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* prettier-ignore */
  background: var(--sidebar-background-1, var(--theme-background-1));
  --sidebar-level: 0;
}

.pages {
  padding-top: 9px;
  padding-bottom: 9px;
}

.sidebar-group {
  list-style: none;
  width: 100%;
}

.sidebar-heading {
  display: flex;
  gap: 6px;

  /* prettier-ignore */
  color: var(--sidebar-color-2, var(--theme-color-2));
  font-size: var(--theme-mini);
  font-weight: var(--theme-semibold);
  word-break: break-word;
  line-height: 1.385;
  display: flex;
  align-items: center;
  max-width: 100%;
  position: relative;
  cursor: pointer;
  /* prettier-ignore */
  border-radius: 0 var(--theme-radius-lg) var(--theme-radius-lg) 0;
  flex: 1;
  padding-right: 12px;
  user-select: none;
}

/* Folder/page collapse icon */
.toggle-nested-icon {
  border: none;
  position: absolute !important;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  color: currentColor;
}

.toggle-nested-icon:hover,
.toggle-nested-icon:focus-visible {
  color: currentColor;
  filter: drop-shadow(0 0.125px 0 currentColor)
    drop-shadow(0 -0.125px 0 currentColor);
}

/* We indent each level of nesting further */
.sidebar-indent-nested .sidebar-heading {
  /* prettier-ignore */
  padding-left: calc((var(--sidebar-level) * var(--theme-sidebar-indent-base)) + 24px) !important;
}

/* Collapse/expand icons must also be offset */
.sidebar-indent-nested .sidebar-heading .toggle-nested-icon {
  /* prettier-ignore */
  left: calc((var(--sidebar-level) * var(--theme-sidebar-indent-base)) + 2px) !important;
}

.sidebar-heading-link {
  padding-right: 12px;
  padding: 6px 0;
  display: flex;
  align-items: center;
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

.sidebar-heading:hover {
  /* prettier-ignore */
  color: var(--sidebar-color-1, var(--theme-color-1));
  /* prettier-ignore */
  background: var(--sidebar-item-hover-background, var(--theme-background-2));
}

.active_page.sidebar-heading:hover,
.active_page.sidebar-heading,
.marc_active .sidebar-heading {
  /* prettier-ignore */
  background: var(--sidebar-item-active-background, var(--theme-background-accent)) !important;
  /* prettier-ignore */
  color: var(--theme-color-accent, var(--theme-background-accent)) !important;
}
.sidebar-group-item {
  position: relative;
}

/* Change font colors and weights for nested items */
.sidebar-indent-nested .sidebar-heading {
  /* prettier-ignore */
  color: var(--sidebar-color-1, var(--theme-color-1));
}
.sidebar-indent-nested .sidebar-indent-nested .sidebar-heading {
  /* prettier-ignore */
  color: var(--sidebar-color-2, var(--theme-color-2));
}
.sidebar-indent-nested > div:has(.active_page) .sidebar-heading {
  font-weight: var(--theme-bold);
}

.sidebar-mobile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  width: 100%;
  padding: 0 6px;
}

.sidebar-mobile-breadcrumbs {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--theme-small);
  font-weight: var(--theme-semibold);
}

.sidebar-mobile-actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
  height: 24px;
  align-items: center;
  padding: 0 4px;
}

.sidebar-mobile-actions .sidebar-mobile-darkmode-toggle {
  height: 16px;
  width: 16px;
}

@media (max-width: 1000px) {
  .sidebar {
    min-height: 0;
  }

  .pages {
    padding-top: 12px;
  }
}

@media (max-width: 500px) {
  .header-item-link.header-item-active,
  .sidebar-section,
  .sidebar-heading {
    font-size: var(--theme-micro);
  }
}
</style>
