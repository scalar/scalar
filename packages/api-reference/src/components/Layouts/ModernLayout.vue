<script setup lang="ts">
import { OpenApiClientButton } from '@scalar/api-client/components'
import {
  ScalarColorModeToggleButton,
  ScalarSidebarFooter,
} from '@scalar/components'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { watch } from 'vue'

import { SearchButton } from '../../features/Search'
import { useNavState, useSidebar } from '../../hooks'
import type { ReferenceLayoutProps, ReferenceLayoutSlots } from '../../types'
import ApiReferenceLayout from '../ApiReferenceLayout.vue'
import MobileHeader from '../MobileHeader.vue'

const props = defineProps<ReferenceLayoutProps>()
defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'updateContent', v: string): void
}>()

const slots = defineSlots<ReferenceLayoutSlots>()

const { mediaQueries } = useBreakpoints()
const { isSidebarOpen } = useSidebar()
const isDevelopment = import.meta.env.MODE === 'development'

watch(mediaQueries.lg, (newValue, oldValue) => {
  // Close the drawer when we go from desktop to mobile
  if (oldValue && !newValue) isSidebarOpen.value = false
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
      <ScalarSidebarFooter class="darklight-reference">
        <OpenApiClientButton
          v-if="!props.configuration.hideClientButton"
          buttonSource="sidebar"
          :integration="configuration._integration"
          :isDevelopment="isDevelopment"
          :url="configuration.spec?.url" />
        <!-- Override the dark mode toggle slot to hide it -->
        <template #toggle>
          <ScalarColorModeToggleButton
            v-if="!props.configuration.hideDarkModeToggle"
            :modelValue="isDark"
            @update:modelValue="$emit('toggleDarkMode')" />
          <span v-else />
        </template>
      </ScalarSidebarFooter>
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
}
</style>
