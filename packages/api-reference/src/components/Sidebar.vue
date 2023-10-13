<script setup lang="ts">
import {
  generateRequest,
  useApiClientRequestStore,
  useApiClientStore,
  useOperation,
} from '@scalar/api-client'
import { useKeyboardEvent } from '@scalar/use-keyboard-event'
import { useMediaQuery } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'

import {
  getHeadingsFromMarkdown,
  getModelSectionId,
  getOperationSectionId,
  hasModels,
} from '../helpers'
import { useTemplateStore } from '../stores/template'
import type { Operation, Spec, Tag } from '../types'
import DarkModeToggle from './DarkModeToggle.vue'
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

async function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView()
  await nextTick()
  setActiveSidebar(id)
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

const moreThanOneDefaultTag = (tag: Tag) =>
  props.spec?.tags?.length !== 1 ||
  tag?.name !== 'default' ||
  tag?.description !== ''

const headings = ref<any[]>([])

watch(
  () => props?.spec?.info?.description,
  async () => {
    const description = props?.spec?.info?.description

    if (!description) {
      return []
    }

    headings.value = await updateHeadings(description)
  },
)

const updateHeadings = async (description: string) => {
  const newHeadings = await getHeadingsFromMarkdown(description)

  const lowestDepth = Math.min(...newHeadings.map((heading) => heading.depth))

  return newHeadings.filter((heading) => heading.depth === lowestDepth)
}
</script>
<template>
  <div class="sidebar">
    {{ state.activeSidebar }}
    <FindAnythingButton
      v-if="!isMobile"
      @click="setTemplateItem('showSearch', true)" />
    <div class="pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <!-- Introduction -->
        <SidebarElement
          v-for="heading in headings"
          :key="heading"
          :isActive="state.activeSidebar === `user-content-${heading.slug}`"
          :item="{
            uid: '',
            title: heading.value.toUpperCase(),
            type: 'Page',
          }"
          @select="
            () => {
              if (heading.slug) {
                scrollToId(`user-content-${heading.slug}`)
              }
            }
          " />

        <!-- Tags -->
        <template v-for="tag in spec.tags">
          <SidebarElement
            v-if="moreThanOneDefaultTag(tag) && tag.operations?.length > 0"
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
                :key="`${operation.httpVerb}-${operation.operationId}`"
                :isActive="
                  state.activeSidebar ===
                  `${operation.httpVerb}-${operation.operationId}`
                "
                :item="{
                  uid: '',
                  title: operation.name || operation.path,
                  type: 'Page',
                }"
                @select="
                  () => {
                    if (state.showApiClient) {
                      showItemInClient(operation)
                    }
                    setCollapsedSidebarItem(tag.name, true)
                    scrollToId(getOperationSectionId(operation))
                  }
                " />
            </SidebarGroup>
          </SidebarElement>
          <template v-else>
            <SidebarElement
              v-for="operation in tag.operations"
              :key="`${operation.httpVerb}-${operation.operationId}`"
              class="sidebar-group-item--without-parent"
              :isActive="
                state.activeSidebar ===
                `${operation.httpVerb}-${operation.operationId}`
              "
              :item="{
                uid: '',
                title: operation.name || operation.path,
                type: 'Page',
              }"
              @select="
                () => {
                  setCollapsedSidebarItem(tag.name, true)
                  scrollToId(getOperationSectionId(operation))
                }
              " />
          </template>
        </template>

        <!-- Models -->
        <template v-if="hasModels(spec)">
          <SidebarElement
            :hasChildren="true"
            :isActive="state.activeSidebar === 'models'"
            :item="{
              uid: '',
              title: 'Models'.toUpperCase(),
              type: 'Folder',
            }"
            :open="templateState.collapsedSidebarItems['models']"
            @toggleOpen="
              () => {
                if (!templateState.collapsedSidebarItems['models']) {
                  scrollToId('models')
                }

                toggleCollapsedSidebarItem('models')
              }
            ">
            <SidebarGroup :level="0">
              <SidebarElement
                v-for="name in Object.keys(spec.components?.schemas ?? {})"
                :key="name"
                class="sidebar-group-item"
                :isActive="state.activeSidebar === getModelSectionId(name)"
                :item="{
                  uid: '',
                  title: name.toUpperCase(),
                  type: 'Page',
                }"
                @select="() => scrollToId('models')" />
            </SidebarGroup>
          </SidebarElement>
        </template>
      </SidebarGroup>
    </div>
    <DarkModeToggle />
  </div>
</template>

<style>
.sidebar {
  --default-theme-sidebar-indent-base: 6px;
}

/* ----------------------------------------------------- */
/* Main sidebar styles */

.sidebar {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid
    var(
      --sidebar-border-color,
      var(
        --default-sidebar-border-color,
        var(--theme-border-color, var(--default-theme-border-color))
      )
    );
  /* prettier-ignore */
  background: var(--sidebar-background-1, var(--default-sidebar-background-1, var(--theme-background-1, var(--default-theme-background-1))));
  --default-sidebar-level: 0;
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

/* Folder/page collapse icon */
.toggle-nested-icon {
  border: none;
  position: absolute !important;
  color: currentColor;
  top: 4px;
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
  padding-left: calc((var(--sidebar-level, var(--default-sidebar-level)) * var(--theme-sidebar-indent-base, var(--default-theme-sidebar-indent-base))) + 24px) !important;
}

/* Collapse/expand icons must also be offset */
.sidebar-indent-nested .sidebar-heading .toggle-nested-icon {
  /* prettier-ignore */
  left: calc((var(--sidebar-level, var(--default-sidebar-level)) * var(--theme-sidebar-indent-base, var(--default-theme-sidebar-indent-base))) + 2px) !important;
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
.sidebar-group-item {
  position: relative;
}

.sidebar-group-item--without-parent .sidebar-heading {
  margin-left: 12px;
  padding-left: 12px !important;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}

/* Change font colors and weights for nested items */
.sidebar-indent-nested .sidebar-heading {
  /* prettier-ignore */
  color: var(--sidebar-color-1, var(--default-sidebar-color-1, var(--theme-color-1, var(--default-theme-color-1))));
}
.sidebar-indent-nested .sidebar-indent-nested .sidebar-heading {
  /* prettier-ignore */
  color: var(--sidebar-color-2, var(--default-sidebar-color-2, var(--theme-color-2, var(--default-theme-color-2))));
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
  font-size: var(--theme-small, var(--default-theme-small));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
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
.active_page.sidebar-heading:hover,
.active_page.sidebar-heading {
  /* prettier-ignore */
  background: var(--sidebar-item-active-background, var(--default-sidebar-item-active-background, var(--theme-background-accent, var(--default-theme-background-accent)))) !important;
}
.active_page.sidebar-heading p,
.active_page.sidebar-heading:hover p {
  /* prettier-ignore */
  color: var(--sidebar-color-active, var(--default-sidebar-color-active, var(--theme-color-accent, var(--default-theme-color-accent)))) !important;
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
    font-size: var(--theme-micro, var(--default-theme-micro));
  }
}
</style>
