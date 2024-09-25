<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useMediaQuery } from '@vueuse/core'
import { watch } from 'vue'

import { SearchButton } from '../../features/Search'
import { useNavState, useSidebar } from '../../hooks'
import type { ReferenceLayoutProps, ReferenceLayoutSlots } from '../../types'
import ApiReferenceLayout from '../ApiReferenceLayout.vue'
import { DarkModeToggle } from '../DarkModeToggle'
import MobileHeader from '../MobileHeader.vue'

const props = defineProps<ReferenceLayoutProps>()
defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'updateContent', v: string): void
}>()

const slots = defineSlots<ReferenceLayoutSlots>()

const isMobile = useMediaQuery('(max-width: 1000px)')
const { isSidebarOpen } = useSidebar()

watch(isMobile, (n, o) => {
  // Close the drawer when we go from desktop to mobile
  if (n && !o) isSidebarOpen.value = false
})

const { hash } = useNavState()
watch(hash, (newHash, oldHash) => {
  if (newHash && newHash !== oldHash) {
    isSidebarOpen.value = false
  }
})
</script>
<template>
  <ApiReferenceLayout
    :class="{
      'scalar-api-references-standalone-mobile': configuration.showSidebar,
    }"
    :configuration="configuration"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @updateContent="$emit('updateContent', $event)">
    <template
      v-for="(_, name) in slots"
      #[name]="slotProps">
      <slot
        :name="name"
        v-bind="slotProps || {}"></slot>
    </template>
    <template #header>
      <MobileHeader
        v-if="props.configuration.showSidebar"
        v-model:open="isSidebarOpen" />
    </template>
    <template #sidebar-start="{ spec }">
      <div
        v-if="!props.configuration.hideSearch"
        class="scalar-api-references-standalone-search">
        <SearchButton
          :searchHotKey="props.configuration?.searchHotKey"
          :spec="spec" />
      </div>
    </template>
    <template #sidebar-end>
      <div class="darklight-reference">
        <a
          class="darklight-reference-client"
          href="#">
          <ScalarIcon
            icon="ExternalLink"
            size="xs"
            thickness="2.5" />
          Scalar API Client</a
        >
        <DarkModeToggle
          v-if="!!!props.configuration.hideDarkModeToggle"
          :isDarkMode="isDark"
          @toggleDarkMode="$emit('toggleDarkMode')" />
      </div>
    </template>
  </ApiReferenceLayout>
</template>
<style>
@media (max-width: 1000px) {
  .scalar-api-references-standalone-mobile {
    --scalar-header-height: 50px;
  }
}
</style>
<style scoped>
.scalar-api-references-standalone-search {
  display: flex;
  flex-direction: column;
  padding: 12px 12px 6px 12px;
}
.darklight-reference {
  width: 100%;
  margin-top: auto;
  border-top: var(--scalar-border-width) solid
    var(--scalar-sidebar-border-color, var(--scalar-border-color));
  padding: 12px;
}
.darklight-reference-client {
  width: 100%;
  padding: 9px 12px;
  height: 31px;
  display: block;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  line-height: 1.385;
  text-decoration: none;
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  margin-bottom: 12px;
  gap: 6px;
  color: var(--scalar-sidebar-color-1);
}
.darklight-reference-client:hover {
  background: var(
    --scalar-sidebar-item-hover-background,
    var(--scalar-background-2)
  );
}
</style>
