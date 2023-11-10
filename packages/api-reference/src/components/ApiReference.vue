<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { type ReferenceProps } from 'src/types'
import { computed } from 'vue'

import { useTemplateStore } from '../stores/template'
import ApiReferenceBase from './ApiReferenceBase.vue'
import DarkModeToggle from './DarkModeToggle.vue'
import MobileHeader from './MobileHeader.vue'
import SearchButton from './SearchButton.vue'

// I don't know why this isn't picking up the v-bind but whatever
// eslint-disable-next-line vue/no-unused-properties
const props = withDefaults(defineProps<ReferenceProps>(), {
  showSidebar: undefined,
  isEditable: undefined,
  footerBelowSidebar: undefined,
})
const { state } = useTemplateStore()

const isMobile = useMediaQuery('(max-width: 1000px)')

// Override the sidebar value for mobile to open and close the drawer
const config = computed(() => {
  const showSidebar = isMobile.value
    ? state.showMobileDrawer
    : props.configuration?.showSidebar
  return { ...props.configuration, showSidebar }
})

// Can hopefully be removed once we remove the props API
const otherProps = computed(() => {
  const { configuration, ...other } = props
  return other
})
</script>
<template>
  <ApiReferenceBase
    v-bind="otherProps"
    :configuration="config">
    <template
      v-if="isMobile"
      #header>
      <MobileHeader />
    </template>
    <template
      v-if="!isMobile"
      #sidebar-start>
      <SearchButton :searchHotKey="props.configuration?.searchHotKey" />
    </template>
    <template #sidebar-end>
      <DarkModeToggle />
    </template>
  </ApiReferenceBase>
</template>
<style>
@media (max-width: 1000px) {
  :root {
    /* By default add a header on mobile for the navigation */
    --theme-header-height: 50px;
  }
}
</style>
