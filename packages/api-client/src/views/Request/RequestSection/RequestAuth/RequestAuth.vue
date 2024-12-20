<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { displaySchemeFormatter } from '@/views/Request/libs'
import { type Icon, ScalarIcon } from '@scalar/components'
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import RequestAuthDataTable from './RequestAuthDataTable.vue'

const { selectedSecuritySchemeUids } = defineProps<{
  selectedSecuritySchemeUids: string[]
  title: string
}>()

const { activeCollection, activeRequest } = useActiveEntities()
const { securitySchemes } = useWorkspace()

/** Security requirements for the request */
const securityRequirements = computed(() => {
  const requirements =
    activeRequest.value?.security ?? activeCollection.value?.security ?? []

  /** Filter out empty objects */
  const filteredRequirements = requirements.filter((r) => Object.keys(r).length)

  return { filteredRequirements, requirements }
})

/** Indicates if auth is required */
const authIndicator = computed(() => {
  const { filteredRequirements, requirements } = securityRequirements.value
  if (!requirements.length) return null

  /** Security is optional if one empty object exists in the array */
  const isOptional = filteredRequirements.length < requirements.length
  const icon: Icon = isOptional ? 'Unlock' : 'Lock'

  /** Dynamic text to indicate auth requirements */
  const requiredText = isOptional ? 'Optional' : 'Required'
  const nameKey =
    filteredRequirements.length === 1
      ? Object.keys(filteredRequirements[0] ?? {})[0]
      : 'Authentication'
  const text = `${nameKey} ${requiredText}`

  return { icon, text }
})

/** Currently selected auth schemes on the collection */
const selectedAuth = computed(() =>
  selectedSecuritySchemeUids
    .map((uid) => {
      const scheme = securitySchemes[uid ?? '']
      if (!scheme) return undefined

      return displaySchemeFormatter(scheme)
    })
    .filter(isDefined),
)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="selectedAuth.length">
    <template #title>
      <div class="flex flex-1 gap-1 items-center justify-between">
        {{ title }}

        <!-- Authentication indicator -->
        <div
          v-if="authIndicator"
          class="flex items-center gap-1 text-c-3">
          {{ authIndicator.text }}
          <ScalarIcon
            class="text-c-3"
            :icon="authIndicator.icon"
            size="xs" />
        </div>
      </div>
    </template>
    <RequestAuthDataTable
      :selectedSecuritySchemeUids="selectedSecuritySchemeUids" />
  </ViewLayoutCollapse>
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
