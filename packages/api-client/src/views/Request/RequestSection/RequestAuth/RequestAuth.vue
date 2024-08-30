<script setup lang="ts">
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/components/DataTable'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarComboboxMultiselect,
  ScalarIcon,
} from '@scalar/components'
import {
  type RequestExample,
  type SecurityScheme,
  securitySchemeExampleValueSchema,
} from '@scalar/oas-utils/entities/spec'
import { computed, ref, toRaw, watch } from 'vue'

import RequestExampleAuth from './RequestExampleAuth.vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  activeRequest,
  activeExample,
  isReadOnly,
  requestExampleMutators,
  securitySchemes,
} = useWorkspace()

const comboboxRef = ref<typeof ScalarComboboxMultiselect | null>(null)

/**
 * Available schemes that can be selected by a requestExample
 *
 * Any utilized auth must have a scheme object at the collection or request level
 * In readonly mode we will use operation level schemes if they are provided
 * Otherwise we only use collection level schemes
 */
const availableSchemes = computed(() => {
  const base =
    isReadOnly.value && activeRequest.value?.security.length
      ? activeRequest.value.security
      : activeCollection.value?.securitySchemes

  return (base ?? []).map((s) => securitySchemes[s])
})

/** Format a scheme object into a display object */
function displaySchemeFormatter(s: SecurityScheme) {
  return {
    id: s.uid,
    label: s.nameKey,
  }
}

/** Display formatted options for a user to select from */
const schemeOptions = computed(() =>
  availableSchemes.value.map((s) => displaySchemeFormatter(s)),
)

/** Currently selected auth schemes on the example */
const selectedAuth = computed(() =>
  Object.keys(activeExample.value?.auth ?? {}).map((k) =>
    displaySchemeFormatter(securitySchemes[k]),
  ),
)

/** Create a new value set for a given scheme type */
function createSchemeValueSet(scheme: SecurityScheme) {
  // Determine the value entry type
  const valueType =
    scheme.type === 'oauth2' ? `oauth-${scheme.flow.type}` : scheme.type

  return securitySchemeExampleValueSchema.parse({
    type: valueType,
  })
}

/** Update the selected auth types */
function updateSelectedAuth(entries: { id: string }[]) {
  if (!activeExample.value?.uid) return

  const auth: RequestExample['auth'] = {}

  // Add the existing auth values back in or create a new entry
  entries.forEach(({ id }) => {
    auth[id] =
      activeExample.value?.auth[id] ?? createSchemeValueSet(securitySchemes[id])
  })

  requestExampleMutators.edit(activeExample.value?.uid, 'auth', auth)
}

/** Remove a single auth type from an example */
function unselectAuth(id: string) {
  if (!activeExample.value?.uid) return

  const { [id]: remove, ...auth } = activeExample.value.auth

  requestExampleMutators.edit(activeExample.value?.uid, 'auth', auth)
}

watch(
  () => schemeOptions.value,
  () => {
    console.log(toRaw(schemeOptions.value))
  },
  { deep: true, immediate: true },
)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="selectedAuth.length">
    <template #title>
      <div class="flex gap-1">
        {{ title }}
      </div>
    </template>
    <DataTable
      class="flex-1"
      :columns="['']">
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full cursor-pointer py-[0px] px-[0px] flex items-center">
          <ScalarComboboxMultiselect
            ref="comboboxRef"
            class="text-xs w-full"
            fullWidth
            :modelValue="selectedAuth"
            multiple
            :options="schemeOptions"
            style="margin-left: 120px"
            teleport
            @update:modelValue="updateSelectedAuth">
            <ScalarButton
              class="h-auto py-0 px-0 text-c-2 hover:text-c-1 font-normal justify-start"
              fullWidth
              variant="ghost">
              <div
                class="text-c-2 h-8 flex min-w-[120px] items-center border-r-1/2 pr-0 pl-2">
                Auth Type
              </div>
              <div
                v-if="selectedAuth.length"
                class="flex relative scroll-timeline-x w-full">
                <div class="fade-left"></div>
                <div class="flex flex-1 gap-0.75 mr-1.5 items-center">
                  <span
                    v-for="auth in selectedAuth"
                    :key="auth.id"
                    class="cm-pill flex items-center mx-0 h-fit">
                    {{ auth.label }}
                    <ScalarIcon
                      class="ml-1 cursor-pointer text-c-3 hover:text-c-1"
                      icon="Close"
                      size="xs"
                      @click.stop="unselectAuth(auth.id)" />
                  </span>
                </div>
                <div class="fade-right"></div>
              </div>
              <div
                v-else
                class="pl-2">
                None
              </div>
              <ScalarIcon
                class="min-w-3 ml-auto mr-2.5"
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarComboboxMultiselect>
        </DataTableHeader>
      </DataTableRow>
      <RequestExampleAuth />
    </DataTable>
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
  z-index: 1;
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
