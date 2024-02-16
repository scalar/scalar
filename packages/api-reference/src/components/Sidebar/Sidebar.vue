<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import { sleep } from '../../helpers'
import { useNavState, useSidebar } from '../../hooks'
import type { Spec } from '../../types'
import SidebarElement from './SidebarElement.vue'
import SidebarGroup from './SidebarGroup.vue'

const props = defineProps<{
  parsedSpec: Spec
}>()

const { hash, isIntersectionEnabled } = useNavState()

const { items, toggleCollapsedSidebarItem, collapsedSidebarItems } = useSidebar(
  {
    parsedSpec: props.parsedSpec,
  },
)

// This offset determines how far down the sidebar the items scroll
const SCROLL_OFFSET = -160
const scrollerEl = ref<HTMLElement | null>(null)
const disableScroll = ref(true)

// Watch for the active item changing so we can scroll the sidebar,
// but not when we click, only on scroll.
// Also disable scroll on expansion of sidebar tag
watch(hash, (id) => {
  if (!isIntersectionEnabled.value || disableScroll.value) return
  scrollSidebar(id, 'smooth')
})

const scrollSidebar = (id: string, behavior?: 'smooth') => {
  const el = document.getElementById(`sidebar-${id}`)
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
  scrollerEl.value.scrollTo({ top, behavior })
}

// TODO timeout is due to sidebar section opening time
onMounted(() => {
  setTimeout(() => {
    scrollSidebar(window.location.hash.replace(/^#/, ''))
  }, 500)
  disableScroll.value = false
})
</script>
<template>
  <div class="sidebar">
    <slot name="sidebar-start" />
    <div
      ref="scrollerEl"
      class="sidebar-pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <template
          v-for="item in items.entries"
          :key="item.id">
          <SidebarElement
            v-if="item.show"
            :id="`sidebar-${item.id}`"
            data-sidebar-type="heading"
            :hasChildren="item.children && item.children.length > 0"
            :isActive="hash === item.id"
            :item="{
              id: item.id,
              title: item.title,
              select: item.select,
              httpVerb: item.httpVerb,
              deprecated: item.deprecated ?? false,
            }"
            :open="collapsedSidebarItems[item.id] ?? false"
            @toggleOpen="
              async () => {
                disableScroll = true
                toggleCollapsedSidebarItem(item.id)
                await sleep(100)
                disableScroll = false
              }
            ">
            <template v-if="item.children && item.children?.length > 0">
              <SidebarGroup :level="0">
                <template
                  v-for="child in item.children"
                  :key="child.id">
                  <SidebarElement
                    v-if="item.show"
                    :id="`sidebar-${child.id}`"
                    :isActive="hash === child.id"
                    :item="{
                      id: child.id,
                      title: child.title,
                      select: child.select,
                      httpVerb: child.httpVerb,
                      deprecated: child.deprecated ?? false,
                    }" />
                </template>
              </SidebarGroup>
            </template>
          </SidebarElement>
        </template>
      </SidebarGroup>
    </div>
    <slot name="sidebar-end" />
  </div>
</template>

<style scoped>
.sidebar {
  --default-theme-sidebar-indent-base: 6px;
}
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
.sidebar-pages {
  flex: 1;
  padding-top: 9px;
  padding-bottom: 9px;
  padding-right: 12px;
}

@media (max-width: 1000px) {
  .sidebar {
    min-height: 0;
  }
  .sidebar-pages {
    padding-top: 12px;
  }
}
</style>
