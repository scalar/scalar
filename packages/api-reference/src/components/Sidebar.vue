<script setup lang="ts">
import { useApiClientStore, useRequestStore } from '@scalar/api-client'
import { useKeyboardEvent } from '@scalar/use-keyboard-event'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import {
  getApiClientRequest,
  getHeadingId,
  getHeadingsFromMarkdown,
  getModelSectionId,
  getOperationSectionId,
  getTagSectionId,
  hasModels,
  scrollToId,
} from '../helpers'
import { useGlobalStore } from '../stores'
import { useTemplateStore } from '../stores/template'
import type { Spec, Tag, TransformedOperation } from '../types'
import DarkModeToggle from './DarkModeToggle.vue'
import FindAnythingButton from './FindAnythingButton.vue'
import SidebarElement from './SidebarElement.vue'
import SidebarGroup from './SidebarGroup.vue'

const props = defineProps<{ spec: Spec }>()

const { server: serverState, authentication: authenticationState } =
  useGlobalStore()

const { state, toggleApiClient } = useApiClientStore()

const { setActiveRequest } = useRequestStore()

function showItemInClient(operation: TransformedOperation) {
  const request = getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: operation,
  })

  setActiveRequest(request)

  toggleApiClient(request, true)
}

const isMobile = useMediaQuery('(max-width: 1000px)')

const {
  state: templateState,
  setItem: setTemplateItem,
  toggleCollapsedSidebarItem,
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

    return (headings.value = await updateHeadings(description))
  },
)

const updateHeadings = async (description: string) => {
  const newHeadings = await getHeadingsFromMarkdown(description)

  const lowestDepth = Math.min(...newHeadings.map((heading) => heading.depth))

  return newHeadings.filter((heading) => heading.depth === lowestDepth)
}

const isVisible = (id: string) => state.sidebarIdVisibility[id] ?? false

type SidebarEntry = {
  id: string
  title: string
  type: 'Page' | 'Folder'
  children?: SidebarEntry[]
  select?: () => void
  httpVerb?: string
}

const items = computed((): SidebarEntry[] => {
  // Introduction
  const headingEntries: SidebarEntry[] = headings.value.map((heading) => {
    return {
      id: getHeadingId(heading),
      title: heading.value.toUpperCase(),
      type: 'Page',
    }
  })

  // Tags & Operations
  const firstTag = props?.spec?.tags?.[0]

  const operationEntries: SidebarEntry[] =
    firstTag &&
    moreThanOneDefaultTag(firstTag) &&
    firstTag.operations?.length > 0
      ? props.spec.tags?.map((tag) => {
          return {
            id: getTagSectionId(tag),
            title: tag.name.toUpperCase(),
            type: 'Folder',
            children: tag.operations?.map((operation) => {
              return {
                id: getOperationSectionId(operation, tag),
                title: operation.name || operation.path,
                type: 'Page',
                httpVerb: operation.httpVerb,
                select: () => {
                  if (state.showApiClient) {
                    showItemInClient(operation)
                  }
                },
              }
            }),
          }
        })
      : firstTag?.operations?.map((operation) => {
          return {
            id: getOperationSectionId(operation, firstTag),
            title: operation.name || operation.path,
            type: 'Page',
            httpVerb: operation.httpVerb,
            select: () => {
              if (state.showApiClient) {
                showItemInClient(operation)
              }
            },
          }
        })

  // Models
  const modelEntries: SidebarEntry[] = hasModels(props.spec)
    ? [
        {
          id: getModelSectionId(),
          title: 'MODELS',
          type: 'Folder',
          children: Object.keys(props.spec.components?.schemas ?? {}).map(
            (name) => {
              return {
                id: getModelSectionId(name),
                title: name,
                type: 'Page',
              }
            },
          ),
        },
      ]
    : []

  return [...headingEntries, ...(operationEntries ?? []), ...modelEntries]
})

const activeSidebarItemId = computed(() => {
  const flattenedItems = items.value.reduce((acc, item) => {
    acc.push(item)

    if (item.children) {
      acc.push(...item.children)
    }

    return acc
  }, [] as SidebarEntry[])

  return flattenedItems.find((item) => isVisible(item.id))?.id ?? null
})

// This offset determines how far down the sidebar the items scroll
const SCROLL_OFFSET = -160
const scrollerEl = ref<HTMLElement | null>(null)
const sidebarRefs = ref<{ [key: string]: HTMLElement }>({})

// Watch for the active item changing so we can scroll the sidebar
watch(activeSidebarItemId, (activeId) => {
  const el = sidebarRefs.value[activeId!]
  if (!el || !scrollerEl.value) return

  let top = SCROLL_OFFSET

  // Since the elements are mostly nested, we need to do some offset calculations
  if (el.getAttribute('data-sidebar-type') === 'heading') {
    top +=
      el.offsetTop +
      (el.getElementsByClassName('sidebar-heading')?.[0] as HTMLElement)
        .offsetHeight
  } else {
    top +=
      el.offsetTop +
      (el.parentElement?.offsetTop ?? 0) +
      (el.parentElement?.parentElement?.offsetTop ?? 0)
  }

  scrollerEl.value?.scrollTo({ top, behavior: 'smooth' })
})

type SidebarElementType = InstanceType<typeof SidebarElement>
const setRef = (el: SidebarElementType, id: string) => {
  if (!el?.el) return
  sidebarRefs.value[id] = el.el
}
</script>
<template>
  <div class="sidebar">
    <FindAnythingButton
      v-if="!isMobile"
      @click="setTemplateItem('showSearch', true)" />
    <div
      ref="scrollerEl"
      class="pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <SidebarElement
          v-for="item in items"
          :key="item.id"
          :ref="(el) => setRef(el as SidebarElementType, item.id)"
          data-sidebar-type="heading"
          :isActive="activeSidebarItemId === item.id"
          :item="{
            uid: '',
            title: item.title,
            type: item.type,
            httpVerb: item.httpVerb,
          }"
          :open="templateState.collapsedSidebarItems[item.id] ?? false"
          @select="
            () => {
              if (item.id) {
                scrollToId(item.id)
              }

              if (item.select) {
                item.select()
              }
            }
          "
          @toggleOpen="() => toggleCollapsedSidebarItem(item.id)">
          <template v-if="item.children && item.children?.length > 0">
            <SidebarGroup :level="0">
              <SidebarElement
                v-for="child in item.children"
                :key="child.id"
                :ref="(el) => setRef(el as SidebarElementType, child.id)"
                :isActive="activeSidebarItemId === child.id"
                :item="{
                  uid: '',
                  title: child.title,
                  type: child.type,
                  httpVerb: child.httpVerb,
                }"
                @select="
                  () => {
                    if (child.id) {
                      scrollToId(child.id)
                    }

                    if (child.select) {
                      child.select()
                    }
                  }
                " />
            </SidebarGroup>
          </template>
        </SidebarElement>
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
  flex: 1;
  justify-content: space-between;
  align-items: flex-start !important;
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
  padding-left: 4px;
}

.sidebar-mobile-actions .sidebar-mobile-darkmode-toggle {
  height: 24px;
  width: 24px;
  margin-top: 0;
}
.sidebar-mobile-actions .sidebar-mobile-darkmode-toggle .darklight {
  height: 24px;
  width: 24px;
  font-size: 0;
  padding: 0;
  margin-top: 0;
  border-top: 0;
  text-indent: 0;
  color: var(--theme-color-3, var(--default-theme-color-3));
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-mobile-actions .sidebar-mobile-darkmode-toggle svg {
  width: 15px;
  height: 15px;
}
.sidebar-mobile-actions .darklight-reference-promo {
  display: none;
}
.active_page.sidebar-heading:hover,
.active_page.sidebar-heading {
  /* prettier-ignore */
  background: var(--sidebar-item-active-background, var(--default-sidebar-item-active-background, var(--theme-background-accent, var(--default-theme-background-accent)))) !important;
}
.active_page.sidebar-heading svg,
.active_page.sidebar-heading:hover svg,
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
