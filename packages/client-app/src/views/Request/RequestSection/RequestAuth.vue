<script setup lang="ts">
import {
  DataTable,
  DataTableHeader,
  DataTableInput,
  DataTableRow,
} from '@/components/DataTable'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { type UpdateCurrentScheme, useWorkspace } from '@/store/workspace'
import { OAuth2 } from '@/views/Request/components'
import type {
  SecuritySchemeOption,
  SecuritySchemeOptionOauth,
} from '@/views/Request/libs'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { camelToTitleWords } from '@scalar/oas-utils/helpers'
import { capitalize, computed } from 'vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  collectionMutators,
  activeSecurityRequirements,
  securitySchemes,
  securitySchemeMutators,
} = useWorkspace()

/** Different oauth flows will require different layouts */
const columnLayout = computed(() =>
  activeScheme.value?.type === 'oauth2' ||
  activeScheme.value?.type === 'openIdConnect'
    ? ['', 'auto', 'auto']
    : [''],
)

/** Generate pretty name for the dropdown label */
const getLabel = (id: string) => {
  const scheme = securitySchemes[id]

  switch (scheme.type) {
    case 'apiKey':
      return `${capitalize(scheme.in)} (${id})`
    case 'http': {
      return `${capitalize(scheme.scheme)} Authentication (${id})`
    }
    case 'openIdConnect':
      return `Open ID Connect (${id})`
    default:
      return 'None'
  }
}

/** Generate the options for the dropdown */
const schemeOptions = computed<SecuritySchemeOption[]>(() =>
  activeSecurityRequirements.value.flatMap((req) => {
    const keys = Object.keys(req)

    // Optional
    if (keys.length === 0) return { id: 'none', label: 'None' }

    // Active requirements
    return keys.flatMap((id) => {
      const scheme = securitySchemes[id]

      // For OAuth2 add all flows
      if (scheme.type === 'oauth2') {
        return Object.keys(scheme.flows).map((flowKey) => ({
          // Since ID's must be unique, we also store the uid and flowKey separately
          id: `${id}${flowKey}`,
          label: `${camelToTitleWords(flowKey)} (${id})`,
          flowKey,
          uid: id,
        }))
      }
      // Or add just a single item
      else return { id, label: getLabel(id) }
    })
  }),
)

/** Currently selected scheme */
const activeScheme = computed(
  () =>
    securitySchemes[
      (schemeModel.value as SecuritySchemeOptionOauth)?.uid ||
        schemeModel.value.id ||
        ''
    ],
)

const schemeModel = computed({
  // Grab the selected OR first security scheme
  get: () => {
    const selectedScheme = activeCollection.value?.selectedSecuritySchemes?.[0]
    return (
      schemeOptions.value.find(
        ({ id }) => id === `${selectedScheme?.uid}${selectedScheme?.flowKey}`,
      ) || schemeOptions.value[0]
    )
  },
  // Update the mutator on set
  set: (opt) => {
    if (!opt?.id) return

    // Handle the case for OAuth flow
    const payload =
      'uid' in opt ? { flowKey: opt.flowKey, uid: opt.uid } : { uid: opt.id }

    collectionMutators.edit(
      activeCollection.value!.uid,
      'selectedSecuritySchemes',
      [payload],
    )
  },
})

/** Steal the type from the mutator */
const updateCurrentScheme: UpdateCurrentScheme = (path, value) =>
  securitySchemeMutators.edit(activeScheme.value.uid, path, value)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="schemeOptions.length">
    <template #title>
      <div class="flex gap-1">
        {{ title }}
      </div>
    </template>
    <DataTable
      class="flex-1"
      :columns="columnLayout">
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full h-8 cursor-pointer py-[2.25px] px-[2.25px] flex items-center">
          <ScalarListbox
            v-model="schemeModel"
            class="font-code text-xxs w-full"
            fullWidth
            :options="schemeOptions"
            teleport>
            <ScalarButton
              class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
              fullWidth
              variant="ghost">
              <span>{{ schemeModel?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarListbox>
        </DataTableHeader>
      </DataTableRow>

      <!-- HTTP Bearer -->
      <DataTableRow
        v-if="
          activeScheme?.type === 'http' && activeScheme.scheme === 'bearer'
        ">
        <DataTableInput
          :modelValue="activeScheme.value"
          placeholder="Token"
          type="password"
          @update:modelValue="(v) => updateCurrentScheme('value', v)">
          Bearer Token
        </DataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template
        v-else-if="
          activeScheme?.type === 'http' && activeScheme.scheme === 'basic'
        ">
        <DataTableRow>
          <DataTableInput
            class="text-c-2"
            :modelValue="activeScheme.value"
            placeholder="Username"
            @update:modelValue="(v) => updateCurrentScheme('value', v)">
            Username
          </DataTableInput>
        </DataTableRow>
        <DataTableRow>
          <DataTableInput
            :modelValue="activeScheme.secondValue"
            placeholder="Token"
            type="password"
            @update:modelValue="(v) => updateCurrentScheme('secondValue', v)">
            Password
          </DataTableInput>
        </DataTableRow>
      </template>

      <!-- API Key -->
      <DataTableRow v-else-if="activeScheme?.type === 'apiKey'">
        <DataTableInput
          :modelValue="activeScheme.value"
          placeholder="Value"
          type="password"
          @update:modelValue="(v) => updateCurrentScheme('value', v)">
          {{ activeScheme.name }}
        </DataTableInput>
      </DataTableRow>

      <!-- OAuth 2 -->
      <OAuth2
        v-else-if="activeScheme?.type === 'oauth2' && 'uid' in schemeModel"
        :activeScheme="activeScheme"
        :schemeModel="schemeModel"
        :updateCurrentScheme="updateCurrentScheme" />
    </DataTable>
  </ViewLayoutCollapse>
</template>
