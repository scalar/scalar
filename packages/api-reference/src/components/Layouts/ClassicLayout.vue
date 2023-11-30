<script setup lang="ts">
import { computed } from 'vue'

import type { ReferenceProps, ReferenceSlots } from '../../types'
import ApiReferenceBase from '../ApiReferenceBase.vue'
import ClassicHeader from '../ClassicHeader.vue'
import SearchButton from '../SearchButton.vue'

const props = defineProps<ReferenceProps>()
defineSlots<ReferenceSlots>()

// Override the sidebar value and hide it
const config = computed(() => ({ ...props.configuration, showSidebar: false }))
</script>
<template>
  <ApiReferenceBase :configuration="config">
    <template #content-start="{ spec }">
      <ClassicHeader>
        <SearchButton
          :searchHotKey="config.searchHotKey"
          :spec="spec" />
      </ClassicHeader>
    </template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end>
      <slot name="footer" />
    </template>
  </ApiReferenceBase>
</template>
