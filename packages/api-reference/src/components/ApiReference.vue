<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { createHead, useSeoMeta } from 'unhead'
import { computed, ref } from 'vue'

import { type ReferenceProps, type SpecConfiguration } from '../types'
import ApiReferenceBase from './ApiReferenceBase.vue'
import DarkModeToggle from './DarkModeToggle.vue'
import MobileHeader from './MobileHeader.vue'
import SearchButton from './SearchButton.vue'

const props = defineProps<ReferenceProps>()

const showMobileDrawer = ref(false)

const isMobile = useMediaQuery('(max-width: 1000px)')

const content = ref('')

// Override the sidebar value for mobile to open and close the drawer
const config = computed(() => {
  const showSidebar = isMobile.value
    ? showMobileDrawer.value
    : props.configuration?.showSidebar
  const spec: SpecConfiguration = props.configuration?.spec || {
    content: content.value,
  }
  return { ...props.configuration, showSidebar, spec }
})

const otherProps = computed(() => {
  const { configuration, ...other } = props
  return other
})

// Create the head tag if the configuration has meta data
if (config.value?.metaData) {
  createHead()
  useSeoMeta(config.value.metaData)
}
</script>
<template>
  <ApiReferenceBase
    :class="{ 'scalar-api-references-standalone-mobile': isMobile }"
    v-bind="otherProps"
    :configuration="config"
    @updateContent="content = $event">
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
