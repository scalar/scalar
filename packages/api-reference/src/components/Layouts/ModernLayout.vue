<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { watch } from 'vue'

import { useNavState, useSidebar } from '../../hooks'
import type { ReferenceLayoutProps, ReferenceSlots } from '../../types'
import ApiReferenceLayout from '../ApiReferenceLayout.vue'
import { DarkModeToggle } from '../DarkModeToggle'
import MobileHeader from '../MobileHeader.vue'
import SearchButton from '../SearchButton.vue'

const props = defineProps<ReferenceLayoutProps>()
defineEmits<{
  (e: 'toggleDarkMode'): void
}>()

defineSlots<ReferenceSlots>()

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
    :rawSpec="rawSpec">
    <template #header>
      <MobileHeader
        v-if="props.configuration.showSidebar"
        v-model:open="isSidebarOpen" />
    </template>
    <template #sidebar-start="{ spec }">
      <div class="scalar-api-references-standalone-search">
        <SearchButton
          :searchHotKey="props.configuration?.searchHotKey"
          :spec="spec" />
      </div>
    </template>
    <template #sidebar-end>
      <DarkModeToggle
        :isDarkMode="isDark"
        @toggleDarkMode="$emit('toggleDarkMode')" />
    </template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
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
</style>
