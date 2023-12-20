<script setup lang="ts">
import { ref, watch } from 'vue'

import { scrollToId } from '../helpers'
import { useNavigation } from '../hooks'
import type { Spec } from '../types'
import SidebarElement from './SidebarElement.vue'
import SidebarGroup from './SidebarGroup.vue'

const props = defineProps<{
  parsedSpec: Spec
}>()

const {
  items,
  activeItemId,
  toggleCollapsedSidebarItem,
  collapsedSidebarItems,
} = useNavigation({
  parsedSpec: props.parsedSpec,
})

// This offset determines how far down the sidebar the items scroll
const SCROLL_OFFSET = -160
const scrollerEl = ref<HTMLElement | null>(null)
const sidebarRefs = ref<{ [key: string]: HTMLElement }>({})

// Watch for the active item changing so we can scroll the sidebar
watch(activeItemId, (activeId) => {
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
    <slot name="sidebar-start" />
    <div
      ref="scrollerEl"
      class="sidebar-pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <template
          v-for="item in items"
          :key="item.id">
          <SidebarElement
            v-if="item.show"
            :ref="(el) => setRef(el as SidebarElementType, item.id)"
            data-sidebar-type="heading"
            :isActive="activeItemId === item.id"
            :item="{
              uid: '',
              title: item.title,
              type: item.type,
              httpVerb: item.httpVerb,
              deprecated: item.deprecated ?? false,
            }"
            :open="collapsedSidebarItems[item.id] ?? false"
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
                <template
                  v-for="child in item.children"
                  :key="child.id">
                  <SidebarElement
                    v-if="item.show"
                    :ref="(el) => setRef(el as SidebarElementType, child.id)"
                    :isActive="activeItemId === child.id"
                    :item="{
                      uid: '',
                      title: child.title,
                      type: child.type,
                      httpVerb: child.httpVerb,
                      deprecated: child.deprecated ?? false,
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
