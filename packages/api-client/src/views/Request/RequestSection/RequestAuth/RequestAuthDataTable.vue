<script setup lang="ts">
import { useModal } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  Collection,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, ref, watch } from 'vue'

import { DataTable } from '@/components/DataTable'
import type { EnvVariable } from '@/store/active-entities'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestAuthTab from './RequestAuthTab.vue'

const {
  collection,
  environment,
  envVariables,
  layout = 'client',
  persistAuth = false,
  selectedSchemeOptions = [],
  server,
  workspace,
} = defineProps<{
  collection: Collection
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  persistAuth: boolean
  selectedSchemeOptions: { id: string; label: string }[]
  server: Server | undefined
  workspace: Workspace
}>()

const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: SecurityScheme['uid']; label: string } | null>(
  null,
)

/** Add new ref for active tab */
const activeAuthIndex = ref(0)

/** Return currently selected schemes including complex auth */
const activeScheme = computed(() => {
  if (!selectedSchemeOptions || selectedSchemeOptions.length === 0) {
    return []
  }

  const option = selectedSchemeOptions[activeAuthIndex.value]
  if (!option) {
    return []
  }

  const keys = option.id.split(',').filter(Boolean)
  return keys.length > 1 ? keys : [option.id]
})

/** Return true if there are any active schemes */
const hasActiveSchemes = computed(() => {
  return activeScheme.value.length > 0
})

watch(
  () => selectedSchemeOptions,
  (newOptions) => {
    if (!newOptions || !newOptions[activeAuthIndex.value]) {
      activeAuthIndex.value = Math.max(0, activeAuthIndex.value - 1)
    }
  },
)
</script>
<template>
  <form @submit.prevent>
    <div
      v-if="selectedSchemeOptions.length > 1"
      class="box-content flex flex-wrap gap-x-2.5 overflow-hidden border border-b-0 px-3"
      :class="layout === 'client' && 'border-x-0'">
      <div
        v-for="(option, index) in selectedSchemeOptions"
        :key="option.id"
        class="relative z-1 -mb-[var(--scalar-border-width)] flex h-8 cursor-pointer"
        :class="[activeAuthIndex === index ? 'text-c-1' : 'text-c-3']">
        <button
          class="floating-bg relative cursor-pointer border-b-[1px] border-transparent py-1 text-sm font-medium"
          type="button"
          @click="activeAuthIndex = index">
          <span class="relative z-10 font-medium whitespace-nowrap">{{
            option.label
          }}</span>
        </button>
        <div
          v-if="activeAuthIndex === index"
          class="absolute inset-x-1 bottom-[var(--scalar-border-width)] left-1/2 z-1 h-px w-full -translate-x-1/2 bg-current" />
      </div>
    </div>

    <DataTable
      v-if="hasActiveSchemes"
      class="flex-1"
      :class="layout === 'reference' && 'bg-b-1 rounded-b-lg border border-t-0'"
      :columns="['']"
      presentational>
      <RequestAuthTab
        :collection="collection"
        :envVariables="envVariables"
        :environment="environment"
        :layout="layout"
        :persistAuth="persistAuth"
        :securitySchemeUids="activeScheme"
        :server="server"
        :workspace="workspace" />
    </DataTable>

    <div
      v-else
      class="text-c-3 bg-b-1 flex min-h-16 items-center justify-center border-t px-4 text-sm"
      :class="
        layout === 'reference' && 'min-h-[calc(4rem+0.5px)] rounded-b-lg border'
      ">
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
