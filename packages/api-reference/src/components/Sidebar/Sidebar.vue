<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

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
  if (
    !isIntersectionEnabled.value ||
    disableScroll.value ||
    typeof window === 'undefined'
  )
    return
  scrollSidebar(id)
})

const scrollSidebar = (id: string) => {
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
  scrollerEl.value.scrollTo({ top, behavior: 'smooth' })
}

// TODO timeout is due to sidebar section opening time
onMounted(() => {
  setTimeout(() => scrollSidebar(hash.value), 500)
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
          <template v-if="item.isGroup">
            <li class="sidebar-group-title">{{ item.title }}</li>
            <template
              v-for="group in item.children"
              :key="group.id">
              <SidebarElement
                :id="`sidebar-${group.id}`"
                data-sidebar-type="heading"
                :hasChildren="group.children && group.children.length > 0"
                :isActive="hash === group.id"
                :item="{
                  id: group.id,
                  title: group.title,
                  select: group.select,
                  httpVerb: group.httpVerb,
                  deprecated: group.deprecated ?? false,
                }"
                :open="collapsedSidebarItems[group.id] ?? false"
                @toggleOpen="
                  async () => {
                    disableScroll = true
                    toggleCollapsedSidebarItem(group.id)
                    await sleep(100)
                    disableScroll = false
                  }
                ">
                <template v-if="group.children && group.children?.length > 0">
                  <SidebarGroup :level="2">
                    <template
                      v-for="child in group.children"
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
          </template>
          <template v-else>
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
                <SidebarGroup :level="1">
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
        </template>
      </SidebarGroup>
    </div>
    <slot name="sidebar-end" />
  </div>
</template>

<style scoped>
.sidebar {
  --scalar-sidebar-indent-base: 12px;
}
.sidebar {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid
    var(--scalar-sidebar-border-color, var(--scalar-border-color));
  background: var(--scalar-sidebar-background-1, var(--scalar-background-1));
  --scalar-sidebar-level: 0;
}
.sidebar-pages {
  flex: 1;
  padding: 9px 12px;
}

@media (max-width: 1000px) {
  .sidebar {
    min-height: 0;
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
  border-top: 1px solid var(--scalar-sidebar-border-color);
  margin-top: 9px;
}
</style>
