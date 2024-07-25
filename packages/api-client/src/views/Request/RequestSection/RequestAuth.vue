<script setup lang="ts">
import { DataTable, DataTableCell, DataTableRow } from '@/components/DataTable'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { type UpdateScheme, useWorkspace } from '@/store/workspace'
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import { OAuth2 } from '@/views/Request/components'
import type { SecuritySchemeOption } from '@/views/Request/libs'
import { ScalarButton, ScalarCombobox, ScalarIcon } from '@scalar/components'
import type { SelectedSchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import { camelToTitleWords } from '@scalar/oas-utils/helpers'
import { capitalize, computed } from 'vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  collectionMutators,
  activeSecurityRequirements,
  activeSecurityScheme,
  securitySchemes,
  securitySchemeMutators,
} = useWorkspace()

/** Generate pretty name for the dropdown label */
const getLabel = (id: string) => {
  const scheme = securitySchemes[id]

  switch (scheme?.type) {
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
      if (scheme?.type === 'oauth2') {
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

const schemeModel = computed({
  // Grab the selected OR first security scheme
  get: () => {
    const selectedScheme = activeCollection.value?.selectedSecuritySchemes?.[0]
    return (
      schemeOptions.value.find(
        ({ id }) =>
          id === `${selectedScheme?.uid}${selectedScheme?.flowKey ?? ''}`,
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
const updateScheme: UpdateScheme = (path, value) =>
  securitySchemeMutators.edit(
    activeSecurityScheme.value?.scheme.uid ?? '',
    path,
    value,
  )
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
    <form>
      <DataTable
        class="flex-1"
        :columns="['']">
        <DataTableRow>
          <DataTableCell
            class="relative col-span-full !p-0 h-8 flex items-center">
            <div
              class="text-c-2 flex min-w-[100px] items-center border-r-1/2 pr-0 pl-2 h-full">
              Auth Type
            </div>
            <ScalarCombobox
              v-model="schemeModel"
              :options="schemeOptions"
              placeholder="Filter by auth type..."
              resize>
              <ScalarButton
                class="flex gap-1.5 h-full justify-start !p-0 text-c-2 flex-1 hover:text-c-1 font-normal"
                fullWidth
                variant="ghost">
                <span class="pl-2">{{ schemeModel?.label }}</span>
                <ScalarIcon
                  icon="ChevronDown"
                  size="xs" />
              </ScalarButton>
            </ScalarCombobox>
          </DataTableCell>
        </DataTableRow>

        <!-- HTTP Bearer -->
        <DataTableRow
          v-if="
            activeSecurityScheme?.scheme.type === 'http' &&
            activeSecurityScheme.scheme.scheme === 'bearer'
          ">
          <RequestAuthDataTableInput
            id="http-bearer-token"
            :modelValue="activeSecurityScheme.scheme.value"
            placeholder="Token"
            type="password"
            @update:modelValue="(v) => updateScheme('value', v)">
            Bearer Token
          </RequestAuthDataTableInput>
        </DataTableRow>

        <!-- HTTP Basic -->
        <template
          v-else-if="
            activeSecurityScheme?.scheme.type === 'http' &&
            activeSecurityScheme.scheme.scheme === 'basic'
          ">
          <DataTableRow>
            <RequestAuthDataTableInput
              id="http-basic-username"
              class="text-c-2"
              :modelValue="activeSecurityScheme.scheme.value"
              placeholder="ScalarEnjoyer01"
              @update:modelValue="(v) => updateScheme('value', v)">
              Username
            </RequestAuthDataTableInput>
          </DataTableRow>
          <DataTableRow>
            <RequestAuthDataTableInput
              id="http-basic-password"
              :modelValue="activeSecurityScheme.scheme.secondValue"
              placeholder="xxxxxx"
              type="password"
              @update:modelValue="(v) => updateScheme('secondValue', v)">
              Password
            </RequestAuthDataTableInput>
          </DataTableRow>
        </template>

        <!-- API Key -->
        <DataTableRow
          v-else-if="activeSecurityScheme?.scheme.type === 'apiKey'">
          <RequestAuthDataTableInput
            :id="`api-key-${activeSecurityScheme.scheme.name}`"
            :modelValue="activeSecurityScheme.scheme.value"
            placeholder="Value"
            type="password"
            @update:modelValue="(v) => updateScheme('value', v)">
            {{ activeSecurityScheme.scheme.name }}
          </RequestAuthDataTableInput>
        </DataTableRow>

        <!-- OAuth 2 -->
        <OAuth2
          v-else-if="
            activeSecurityScheme?.scheme.type === 'oauth2' &&
            schemeModel &&
            'uid' in schemeModel &&
            activeSecurityScheme.flow
          "
          :activeScheme="activeSecurityScheme as SelectedSchemeOauth2"
          :schemeModel="schemeModel"
          :updateScheme="updateScheme" />
      </DataTable>
    </form>
  </ViewLayoutCollapse>
</template>
