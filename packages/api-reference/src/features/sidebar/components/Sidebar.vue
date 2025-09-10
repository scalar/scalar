<script setup lang="ts">
import { sleep } from '@scalar/helpers/testing/sleep'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import type { TraversedEntry } from '@/features/traverse-schema'
import type {
  TraversedDescription,
  TraversedTag,
} from '@/features/traverse-schema/types'
import { useNavState } from '@/hooks/useNavState'

import { useSidebar } from '../hooks/useSidebar'
import SidebarElement from './SidebarElement.vue'
import SidebarGroup from './SidebarGroup.vue'

const { title } = defineProps<{
  title: string
}>()

const { hash, isIntersectionEnabled } = useNavState()
const { items, toggleCollapsedSidebarItem, collapsedSidebarItems } =
  useSidebar()

// This offset determines how far down the sidebar the items scroll
const SCROLL_OFFSET = -160
const scrollerEl = ref<HTMLElement | null>(null)
const disableScroll = ref(true)

// Watch for the active item changing so we can scroll the sidebar,
// but not when we click, only on scroll.
// Also disable scroll on expansion of sidebar tag
watch(hash, (id) => {
  if (
    !isIntersectionEnabled.value ||
    disableScroll.value ||
    typeof window === 'undefined'
  ) {
    return
  }
  scrollSidebar(id)
})

const scrollSidebar = (id: string) => {
  const el = document.getElementById(`sidebar-${id}`)
  if (!el || !scrollerEl.value) {
    return
  }

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
  scrollerEl.value.scrollTo({ top, behavior: 'smooth' })
}

/** Adds an observer to watch for elements */
const observeSidebarElement = (id: string) => {
  if (!scrollerEl.value) {
    return
  }

  const observer = new MutationObserver((_mutations, obs) => {
    const el = document.getElementById(`sidebar-${id}`)
    if (el) {
      scrollSidebar(id)
      disableScroll.value = false
      obs.disconnect() // Stop observing once we find the element
    }
  })

  // Start observing the document with the configured parameters
  observer.observe(scrollerEl.value, {
    childList: true,
    subtree: true,
  })

  return observer
}

/** Determines if an item is active based on the current hash */
const isItemActive = (itemId: string) => {
  // Exact match - this handles all normal cases
  if (hash.value === itemId) {
    return true
  }

  // Check if current hash is a markdown heading within this operation
  if (hash.value.includes('/description/')) {
    // Extract the operation ID (everything before /description/)
    const operationId = hash.value.split('/description/')[0]
    return operationId === itemId
  }

  return false
}

const observer = ref<MutationObserver | undefined>(undefined)
onMounted(() => {
  observer.value = observeSidebarElement(hash.value)

  // Enable scrolling after some time
  if (!hash.value) {
    setTimeout(() => (disableScroll.value = false), 300)
  }
})

// Cleanup the observer when component is unmounted
onUnmounted(() => {
  observer.value?.disconnect()
})

const hasChildren = (
  item: TraversedEntry,
): item is TraversedTag | TraversedDescription =>
  'children' in item && (item.children?.length ?? 0) > 0
</script>
<template>
  <div class="sidebar">
    <slot name="sidebar-start" />
    <nav
      ref="scrollerEl"
      :aria-label="`Table of contents for ${title}`"
      class="sidebar-pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <template
          v-for="item in items.entries"
          :key="item.id">
          <template v-if="'isGroup' in item && item.isGroup">
            <li class="sidebar-group-title">
              {{ item.title }}
            </li>
            <template
              v-for="group in item.children"
              :key="group.id">
              <SidebarElement
                :id="`sidebar-${group.id}`"
                data-sidebar-type="heading"
                :hasChildren="hasChildren(group)"
                :isActive="isItemActive(group.id)"
                :item="group"
                :open="collapsedSidebarItems[group.id] ?? false"
                @toggleOpen="
                  async () => {
                    disableScroll = true
                    toggleCollapsedSidebarItem(group.id)
                    await sleep(100)
                    disableScroll = false
                  }
                ">
                <template v-if="hasChildren(group)">
                  <SidebarGroup :level="1">
                    <template
                      v-for="child in group.children"
                      :key="child.id">
                      <SidebarElement
                        :id="`sidebar-${child.id}`"
                        :isActive="isItemActive(child.id)"
                        :item="child" />
                    </template>
                  </SidebarGroup>
                </template>
              </SidebarElement>
            </template>
          </template>
          <template v-else>
            <SidebarElement
              :id="`sidebar-${item.id}`"
              data-sidebar-type="heading"
              :hasChildren="hasChildren(item)"
              :isActive="isItemActive(item.id)"
              :item="item"
              :open="collapsedSidebarItems[item.id] ?? false"
              @toggleOpen="
                async () => {
                  disableScroll = true
                  toggleCollapsedSidebarItem(item.id)
                  await sleep(100)
                  disableScroll = false
                }
              ">
              <template v-if="hasChildren(item)">
                <SidebarGroup :level="1">
                  <template
                    v-for="child in item.children"
                    :key="child.id">
                    <SidebarElement
                      :id="`sidebar-${child.id}`"
                      :isActive="isItemActive(child.id)"
                      :item="child" />
                  </template>
                </SidebarGroup>
              </template>
            </SidebarElement>
          </template>
        </template>
      </SidebarGroup>
    </nav>
    <slot name="sidebar-end" />
  </div>
</template>

<style scoped>
.sidebar {
  --scalar-sidebar-indent-base: 20px;
  --scalar-sidebar-font-weight-active: var(--scalar-semibold);
  --scalar-sidebar-font-weight: var(--scalar-regular);
}
.sidebar {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: var(--scalar-border-width) solid
    var(--scalar-sidebar-border-color, var(--scalar-border-color));
  background: var(--scalar-sidebar-background-1, var(--scalar-background-1));
  --scalar-sidebar-level: 0;
}
.sidebar-pages {
  flex: 1;
  padding: 6px 12px;
}

@media (max-width: 1000px) {
  .sidebar {
    min-height: 0;
    border-right: none;
  }
  .sidebar-pages {
    padding-top: 12px;
  }
}
.sidebar-group-title {
  color: var(--scalar-sidebar-color-1);
  font-size: var(--scalar-mini);
  padding: 12px 6px 6px;
  font-weight: var(--scalar-semibold);
  text-transform: uppercase;
  word-break: break-word;
  line-height: 1.385;
}
.sidebar-group-item + .sidebar-group-title {
  border-top: var(--scalar-border-width) solid
    var(--scalar-sidebar-border-color);
  margin-top: 9px;
}
</style>
