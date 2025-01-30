<script setup lang="ts">
import { DataTable } from '@/components/DataTable'
import { useModal } from '@scalar/components'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, ref, watch } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestAuthTab from './RequestAuthTab.vue'

const {
  collection,
  layout = 'client',
  selectedSchemeOptions = [],
  server,
  workspace,
} = defineProps<{
  collection: Collection
  layout: 'client' | 'reference'
  selectedSchemeOptions: { id: string; label: string }[]
  server: Server | undefined
  workspace: Workspace
}>()

const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: string; label: string } | null>(null)

/** Add new ref for active tab */
const activeAuthIndex = ref(0)

/** Return currently selected schemes including complex auth */
const activeScheme = computed(() => {
  const option = selectedSchemeOptions[activeAuthIndex.value]
  if (!option) return []
  const keys = option?.id.split(',')
  return keys.length > 1 ? keys : [option.id]
})

watch(
  () => selectedSchemeOptions,
  (newOptions) => {
    if (!newOptions[activeAuthIndex.value]) {
      activeAuthIndex.value = Math.max(0, activeAuthIndex.value - 1)
    }
  },
)
</script>
<template>
  <form @submit.prevent>
    <div
      v-if="selectedSchemeOptions.length > 1"
      class="border-t flex px-3 flex-wrap gap-x-2.5 overflow-hidden">
      <div
        v-for="(option, index) in selectedSchemeOptions"
        :key="option.id"
        class="flex relative h-8 z-1 cursor-pointer -mb-[var(--scalar-border-width)]"
        :class="[activeAuthIndex === index ? 'text-c-1' : 'text-c-3']">
        <button
          class="floating-bg py-1 text-sm border-b-[1px] border-transparent relative cursor-pointer font-medium"
          type="button"
          @click="activeAuthIndex = index">
          <span class="whitespace-nowrap font-medium z-10 relative">{{
            option.label
          }}</span>
        </button>
        <div
          class="absolute bottom-0 z-0 -inset-x-96 h-[var(--scalar-border-width)] bg-border" />
        <div
          v-if="activeAuthIndex === index"
          class="absolute bottom-[var(--scalar-border-width)] z-1 inset-x-1 h-px bg-current left-1/2 -translate-x-1/2 w-full" />
      </div>
    </div>

    <DataTable
      v-if="activeScheme.length"
      class="flex-1"
      :class="layout === 'reference' && 'border-0'"
      :columns="['']">
      <RequestAuthTab
        :collection="collection"
        :layout="layout"
        :securitySchemeUids="activeScheme"
        :server="server"
        :workspace="workspace" />
    </DataTable>

    <div
      v-else
      class="text-c-3 px-4 text-sm border-t min-h-16 justify-center flex items-center bg-b-1">
      No authentication selected
    </div>

    <DeleteRequestAuthModal
      :scheme="selectedScheme"
      :state="deleteSchemeModal"
      @close="deleteSchemeModal.hide()" />
  </form>
</template>
<style scoped>
.auth-combobox-position {
  margin-left: 120px;
}
.scroll-timeline-x {
  overflow: auto;
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.fade-left,
.fade-right {
  position: sticky;
  content: '';
  height: 100%;
  animation-name: fadein;
  animation-duration: 1ms;
  animation-direction: reverse;
  animation-timeline: --scroll-timeline;
  min-height: 24px;
  pointer-events: none;
}
.fade-left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 60%,
    var(--scalar-background-1) 100%
  );
  min-width: 3px;
  left: -1px;
  animation-direction: normal;
}
.fade-right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 60%,
    var(--scalar-background-1) 100%
  );
  margin-left: -20px;
  min-width: 24px;
  right: -1px;
  top: 0;
}
@keyframes fadein {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
}

/* .references-auth-data-table :deep(table td) {
  margin: 0 9px;
  background: var(--scalar-background-2);
} */

/* More than one selected */
/* .references-auth-data-table
  :deep(table:has(.group\/delete) tr:nth-child(2) td) {
  border-radius: var(--scalar-radius) var(--scalar-radius) 0 0;
  border: 0.5px solid var(--scalar-border-color);
  border-bottom: none;
}
.references-auth-data-table
  :deep(table:not(:has(.group\/delete)) tr:nth-child(3) td) {
  border-radius: var(--scalar-radius) var(--scalar-radius) 0 0;
  border: 0.5px solid var(--scalar-border-color);
  border-bottom: none;
}
.references-auth-data-table :deep(table tr:last-child td) {
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  border: 0.5px solid var(--scalar-border-color);
  border-top: none;
}

.references-auth-data-table :deep(.references-auth-row:last-of-type) td {
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  background: blue;
}
.references-auth-data-table :deep(.scalar-data-table-input-required) {
  background-color: var(--scalar-background-2);
  --tw-bg-base: var(--scalar-background-2);
  --tw-shadow: var(--scalar-background-2);
} */
</style>
