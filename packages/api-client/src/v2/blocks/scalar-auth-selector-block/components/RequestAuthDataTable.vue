<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  ComponentsObject,
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, watch } from 'vue'

import { DataTable } from '@/components/DataTable'
import type { EnvVariable } from '@/store'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'

import RequestAuthTab from './RequestAuthTab.vue'

const {
  environment,
  envVariables,
  layout = 'client',
  selectedSchemeOptions = [],
  server,
} = defineProps<{
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  selectedSchemeOptions: OpenApiDocument['x-scalar-selected-security']
  securitySchemes: ComponentsObject['securitySchemes']
  server: ServerObject | undefined
}>()

const emits = defineEmits<{
  (e: 'update:securityScheme', payload: UpdateSecuritySchemeEvent): void
  (
    e: 'update:selectedScopes',
    payload: { id: string[]; name: string; scopes: string[] },
  ): void
}>()

/** Add new ref for active tab */
const activeAuthIndex = ref(0)

/** Return currently selected schemes including complex auth */
const activeScheme = computed(() => {
  return selectedSchemeOptions[activeAuthIndex.value]
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
        :key="Object.keys(option).join(' & ')"
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
      v-if="activeScheme"
      class="flex-1"
      :class="layout === 'reference' && 'bg-b-1 rounded-b-lg border border-t-0'"
      :columns="['']"
      presentational>
      <RequestAuthTab
        :envVariables="envVariables"
        :environment="environment"
        :layout="layout"
        :securitySchemes="securitySchemes ?? {}"
        :selectedSecuritySchema="activeScheme"
        :server="server"
        @update:securityScheme="emits('update:securityScheme', $event)"
        @update:selectedScopes="emits('update:selectedScopes', $event)" />
    </DataTable>

    <div
      v-else
      class="text-c-3 bg-b-1 flex min-h-16 items-center justify-center border-t px-4 text-sm"
      :class="
        layout === 'reference' && 'min-h-[calc(4rem+0.5px)] rounded-b-lg border'
      ">
      No authentication selected
    </div>
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
</style>
