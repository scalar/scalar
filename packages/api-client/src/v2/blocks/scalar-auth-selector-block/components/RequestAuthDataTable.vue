<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type {
  ComponentsObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { DataTable } from '@/components/DataTable'
import type { EnvVariable } from '@/store'
import type { SecuritySchemeOption } from '@/v2/blocks/scalar-auth-selector-block/helpers/security-scheme'

import RequestAuthTab from './RequestAuthTab.vue'

const {
  environment,
  envVariables,
  layout = 'client',
  selectedSchemeOptions = [],
  server,
  eventBus,
  activeAuthIndex,
  meta,
} = defineProps<{
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  selectedSchemeOptions: SecuritySchemeOption[]
  activeAuthIndex: number
  securitySchemes: ComponentsObject['securitySchemes']
  server: ServerObject | undefined
  eventBus: WorkspaceEventBus
  meta: AuthMeta
}>()

/** Return currently selected schemes including complex auth */
const activeScheme = computed(() => {
  return selectedSchemeOptions[activeAuthIndex]
})

defineExpose({
  activeAuthIndex,
  activeScheme,
})
</script>
<template>
  <form @submit.prevent>
    <div
      v-if="selectedSchemeOptions.length > 1"
      class="box-content flex flex-wrap gap-x-2.5 overflow-hidden border border-b-0 px-3"
      :class="layout === 'client' && 'border-x-0'"
      data-testid="auth-tabs">
      <div
        v-for="(option, index) in selectedSchemeOptions"
        :key="option.id"
        class="relative z-1 -mb-[var(--scalar-border-width)] flex h-8 cursor-pointer"
        :class="[activeAuthIndex === index ? 'text-c-1' : 'text-c-3']">
        <button
          class="floating-bg relative cursor-pointer border-b-[1px] border-transparent py-1 text-sm font-medium"
          type="button"
          @click="
            () => eventBus.emit('update:active-auth-index', { index, meta })
          ">
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
        :selectedSecuritySchemas="activeScheme.value"
        :server="server"
        @update:securityScheme="
          (payload) =>
            eventBus.emit('update:security-scheme', {
              data: payload,
              name: activeScheme?.id ?? '',
            })
        "
        @update:selectedScopes="
          ({ id, name, scopes }) =>
            eventBus.emit('update:selected-scopes', { id, name, scopes, meta })
        " />
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
