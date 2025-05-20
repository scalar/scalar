<script setup lang="ts">
import { ScalarColorModeToggleIcon } from '@scalar/components'
import { getObjectKeys } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import ClassicHeader from '@/components/ClassicHeader.vue'
import { SearchButton } from '@/features/Search'
import type {
  DocumentSelectorSlot,
  ReferenceLayoutProps,
  ReferenceLayoutSlots,
} from '@/types'

const props = defineProps<ReferenceLayoutProps>()

defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'updateContent', v: string): void
}>()

const slots = defineSlots<ReferenceLayoutSlots & DocumentSelectorSlot>()

// Override the sidebar value and hide it
const config = computed(() => ({ ...props.configuration, showSidebar: false }))
</script>
<template>
  <ApiReferenceLayout
    :configuration="config"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @updateContent="$emit('updateContent', $event)">
    <!-- Expose all layout slots upwards -->
    <template
      v-for="name in getObjectKeys(slots)"
      #[name]="slotProps">
      <slot
        :name="name"
        v-bind="slotProps || {}" />
    </template>
    <template #content-start="{ spec }">
      <ClassicHeader>
        <div
          v-if="$slots['document-selector']"
          class="w-64">
          <slot name="document-selector" />
        </div>
        <SearchButton
          v-if="!props.configuration.hideSearch"
          class="t-doc__sidebar"
          :searchHotKey="config.searchHotKey"
          :spec="spec" />
        <template #dark-mode-toggle>
          <ScalarColorModeToggleIcon
            v-if="!props.configuration.hideDarkModeToggle"
            class="text-c-2 hover:text-c-1"
            :mode="isDark ? 'dark' : 'light'"
            style="transform: scale(1.4)"
            variant="icon"
            @click="$emit('toggleDarkMode')" />
        </template>
      </ClassicHeader>
    </template>
  </ApiReferenceLayout>
</template>
