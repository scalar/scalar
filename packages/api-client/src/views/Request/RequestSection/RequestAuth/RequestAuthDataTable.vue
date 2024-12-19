<script setup lang="ts">
import { DataTable } from '@/components/DataTable'
import { useWorkspace } from '@/store'
import { displaySchemeFormatter } from '@/views/Request/libs'
import { useModal } from '@scalar/components'
import { computed, ref } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestExampleAuth from './RequestExampleAuth.vue'

const { selectedSecuritySchemeUids, layout = 'client' } = defineProps<{
  selectedSecuritySchemeUids: string[]
  layout?: 'client' | 'reference'
}>()

const { securitySchemes } = useWorkspace()

const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: string; label: string } | undefined>(undefined)

// Add new ref for active tab
const activeAuthIndex = ref(0)

// Modify computed properties to handle single active auth
const activeAuth = computed(() => {
  return selectedSecuritySchemeUids[activeAuthIndex.value] || null
})
</script>
<template>
  <form>
    <div
      v-if="selectedSecuritySchemeUids.length > 1"
      class="flex gap-y-1 px-1 flex-wrap overflow-hidden">
      <div
        v-for="(schemeUid, index) in selectedSecuritySchemeUids"
        :key="schemeUid"
        class="flex relative h-8 z-1 py-1 px-1.25 cursor-pointer -mb-[var(--scalar-border-width)]"
        :class="[activeAuthIndex === index ? 'text-c-1' : 'text-c-3']">
        <button
          class="text-sm text-inherit rounded bg-transparent hover:bg-b-2 px-1"
          type="button"
          @click="activeAuthIndex = index">
          <span class="whitespace-nowrap font-medium">{{
            displaySchemeFormatter(securitySchemes[schemeUid]).label
          }}</span>
        </button>
        <div
          class="absolute bottom-0 z-0 -inset-x-96 h-[var(--scalar-border-width)] bg-border" />
        <div
          v-if="activeAuthIndex === index"
          class="absolute bottom-[var(--scalar-border-width)] z-1 inset-x-1 h-px bg-current" />
      </div>
    </div>

    <DataTable
      v-if="activeAuth"
      class="flex-1"
      :class="layout === 'reference' && 'border-0'"
      :columns="['']">
      <RequestExampleAuth
        :layout="layout"
        :selectedSecuritySchemeUids="[activeAuth]" />
    </DataTable>

    <div
      v-if="!selectedSecuritySchemeUids.length"
      class="text-c-3 px-4 text-sm border-t-1/2 min-h-16 justify-center flex items-center bg-b-1">
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
