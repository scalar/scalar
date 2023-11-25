<script setup lang="ts">
import { createHead, useSeoMeta } from 'unhead'
import { computed, ref } from 'vue'

import { type ReferenceProps, type SpecConfiguration } from '../types'
import ApiReferenceBase from './ApiReferenceBase.vue'
import ClassicHeader from './ClassicHeader.vue'
import SearchButton from './SearchButton.vue'

const props = defineProps<ReferenceProps>()

const content = ref('')

// Override the sidebar value for mobile to open and close the drawer
const config = computed(() => {
  const spec: SpecConfiguration = props.configuration?.spec || {
    content: content.value,
  }
  return { ...props.configuration, spec }
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
    v-bind="otherProps"
    :configuration="config"
    @updateContent="content = $event">
    <template #content-start="{ spec }">
      <ClassicHeader>
        <SearchButton
          :searchHotKey="props.configuration?.searchHotKey"
          :spec="spec" />
      </ClassicHeader>
    </template>
  </ApiReferenceBase>
</template>
<style>
:root {
  --theme-sidebar-width: 0;
}
</style>
