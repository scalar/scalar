<script setup lang="ts">
import { ScalarColorModeToggleIcon } from '@scalar/components'
import { computed } from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import ClassicHeader from '@/components/ClassicHeader.vue'
import { SearchButton } from '@/features/Search'
import type { ReferenceLayoutProps, ReferenceLayoutSlots } from '@/types'

const props = defineProps<ReferenceLayoutProps>()

defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'updateContent', v: string): void
}>()

const slots = defineSlots<ReferenceLayoutSlots>()

// Override the sidebar value and hide it
const config = computed(() => ({ ...props.configuration, showSidebar: false }))

// Add API selection functionality
const handleSpecChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value

  // Update URL query parameter and reload page
  const url = new URL(window.location.href)
  url.searchParams.set('selectedAPI', value)
  window.location.href = url.toString() // This will trigger a page reload
}

const selectedApiName = computed(() => {
  const params = new URLSearchParams(window.location.search)
  const selected = params.get('selectedAPI')

  // Return selected API name if it exists in specs, otherwise return first spec name
  return selected &&
    props.configuration?.specs?.find((s) => s.name === selected)
    ? selected
    : props.configuration?.specs?.[0]?.name
})
</script>
<template>
  <ApiReferenceLayout
    :configuration="config"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @updateContent="$emit('updateContent', $event)">
    <!-- Expose all layout slots upwards -->
    <template
      v-for="(_, name) in slots"
      #[name]="slotProps">
      <slot
        :name="name"
        v-bind="slotProps || {}" />
    </template>
    <template #content-start="{ spec }">
      <ClassicHeader>
        <!-- Add API selector -->
        <div
          v-if="
            props.configuration?.specs && props.configuration.specs.length > 1
          ">
          <select
            class="spec-selector"
            :value="selectedApiName"
            @change="handleSpecChange">
            <option
              v-for="spec in props.configuration.specs"
              :key="spec.name"
              :value="spec.name">
              {{ spec.name }}
            </option>
          </select>
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
