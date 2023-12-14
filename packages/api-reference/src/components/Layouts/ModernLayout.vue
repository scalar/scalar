<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import { useNavigation } from '../../hooks'
import { type ReferenceProps, type ReferenceSlots } from '../../types'
import ApiReferenceBase from '../ApiReferenceBase.vue'
import DarkModeToggle from '../DarkModeToggle.vue'
import MobileHeader from '../MobileHeader.vue'
import SearchButton from '../SearchButton.vue'

const props = defineProps<ReferenceProps>()
defineSlots<ReferenceSlots>()

const showMobileDrawer = ref(false)

const isMobile = useMediaQuery('(max-width: 1000px)')

watch(isMobile, (n, o) => {
  // Close the drawer when we go from desktop to mobile
  if (n && !o) showMobileDrawer.value = false
})

// Override the sidebar value for mobile to open and close the drawer
const config = computed(() => {
  const showSidebar = isMobile.value
    ? showMobileDrawer.value
    : props.configuration?.showSidebar
  return { ...props.configuration, showSidebar }
})

const { activeItemId } = useNavigation()

watch(activeItemId, (n, o) => {
  if (n && n !== o) {
    showMobileDrawer.value = false
  }
})
</script>
<template>
  <ApiReferenceBase
    :class="{ 'scalar-api-references-standalone-mobile': isMobile }"
    :configuration="config">
    <template
      v-if="isMobile"
      #header>
      <MobileHeader v-model:open="showMobileDrawer" />
    </template>
    <template #sidebar-start="{ spec }">
      <div class="scalar-api-references-standalone-search">
        <SearchButton
          :searchHotKey="props.configuration?.searchHotKey"
          :spec="spec" />
      </div>
    </template>
    <template #sidebar-end>
      <DarkModeToggle />
    </template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
  </ApiReferenceBase>
</template>
<style>
.scalar-api-references-standalone-mobile {
  /* By default add a header on mobile for the navigation */
  --theme-header-height: 50px;
}
</style>
<style scoped>
.scalar-api-references-standalone-search {
  display: flex;
  flex-direction: column;
  padding: 12px 12px 6px 12px;
}
</style>
