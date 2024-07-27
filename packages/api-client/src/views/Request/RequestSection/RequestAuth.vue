<script setup lang="ts">
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/components/DataTable'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { type UpdateScheme, useWorkspace } from '@/store/workspace'
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import { OAuth2 } from '@/views/Request/components'
import type {
  SecuritySchemeGroup,
  SecuritySchemeOption,
} from '@/views/Request/libs'
import {
  ScalarButton,
  ScalarComboboxMultiselect,
  ScalarIcon,
} from '@scalar/components'
import type { SecurityScheme } from '@scalar/oas-utils/entities/workspace/security'
import { camelToTitleWords } from '@scalar/oas-utils/helpers'
import { capitalize, computed, ref } from 'vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  activeRequest,
  activeSecurityRequirements,
  activeSecuritySchemes,
  isReadOnly,
  requestMutators,
  securitySchemeMutators,
  securitySchemes,
} = useWorkspace()

const comboboxRef = ref<typeof ScalarComboboxMultiselect | null>(null)

/** Generate pretty name for the dropdown label */
const getLabel = (scheme: SecurityScheme) => {
  switch (scheme?.type) {
    case 'apiKey':
      return `${capitalize(scheme.in)}`
    case 'http': {
      return `${capitalize(scheme.scheme)} Authentication`
    }
    case 'oauth2':
      return camelToTitleWords(scheme.flow.type)
    case 'openIdConnect':
      return `Open ID Connect`
    default:
      return 'None'
  }
}

/** Generate the options for the dropdown */
const schemeOptions = computed<SecuritySchemeOption[] | SecuritySchemeGroup>(
  () => {
    // For the modal we only provide available auth
    if (isReadOnly.value) {
      const securitySchemesDict = activeCollection.value?.securitySchemeDict

      return activeSecurityRequirements.value.flatMap((req) => {
        const keys = Object.keys(req)

        // Optional
        if (keys.length === 0)
          return { id: 'none', label: 'None', labelWithoutId: 'None' }

        // Active requirements
        return keys.flatMap((key) => {
          if (!securitySchemesDict) return []

          const id = securitySchemesDict[key]
          const scheme = securitySchemes[id]
          const label = getLabel(scheme)

          return {
            id,
            label: `${label} (${key})`,
            labelWithoutId: label,
          }
        })
      })
    }
    // For the client app we provide all options
    else {
      // add collection level as well
      return {
        label: 'Add new auth',
        options: [
          {
            id: 'apiKeyCookie',
            label: 'API Key in Cookies',
          },
          {
            id: 'apiKeyHeader',
            label: 'API Key in Headers',
          },
          {
            id: 'apiKeyQuery',
            label: 'API Key in Query Params',
          },
          {
            id: 'httpBasic',
            label: 'HTTP Basic',
          },
          {
            id: 'httpBearer',
            label: 'HTTP Bearer',
          },
          {
            id: 'oauth2Implicit',
            label: 'Oauth2 Implicit Flow',
          },
          {
            id: 'oauth2Password',
            label: 'Oauth2 Password Flow',
          },
          {
            id: 'oauth2ClientCredentials',
            label: 'Oauth2 Client Credentials',
          },
          {
            id: 'oauth2AuthorizationFlow',
            label: 'Oauth2 Authorization Flow',
          },
        ],
      }
    }
  },
)

const selectedAuth = computed({
  // Grab the selected OR first security scheme
  get: () =>
    (Array.isArray(schemeOptions)
      ? schemeOptions
      : Object.values(schemeOptions).flatMap((val) => val.options)
    ).filter(({ id }) =>
      activeRequest.value?.selectedSecuritySchemeUids?.find(
        (uid) => uid === id,
      ),
    ),

  // Update the selected auth per this request
  set: (options) => {
    console.log(options)
    // If we hit one of the add new auth options close the popup
    comboboxRef.value?.comboboxPopoverRef?.popoverButtonRef?.el?.click()
  },
  // requestMutators.edit(
  //   activeRequest.value.uid,
  //   'selectedSecuritySchemeUids',
  //   options.map((opt) => opt.id),
  // ),
})

type UpdateSchemeParams = Parameters<UpdateScheme>

/** Update the selected scheme */
const updateScheme = (
  scheme: SecurityScheme,
  path: UpdateSchemeParams[0],
  value: UpdateSchemeParams[1],
) => securitySchemeMutators.edit(scheme.uid ?? '', path, value)

/** Combine values from all selected options */
const selectedLabel = computed(() => {
  if (selectedAuth.value.length > 1)
    return selectedAuth.value
      .map(({ labelWithoutId }) => labelWithoutId)
      .join(', ')
  else if (selectedAuth.value.length) return selectedAuth.value[0].label
  else return 'None'
})
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
          <DataTableHeader
            class="relative col-span-full cursor-pointer py-[0px] px-[0px] flex items-center">
            <ScalarComboboxMultiselect
              ref="comboboxRef"
              v-model="selectedAuth"
              class="text-xs w-full left-2"
              fullWidth
              multiple
              :options="schemeOptions"
              teleport>
              <ScalarButton
                class="flex gap-1.5 h-auto py-0 px-0 text-c-2 hover:text-c-1 font-normal"
                fullWidth
                variant="ghost">
                <div class="flex h-8 items-center">
                  <div
                    class="text-c-2 flex min-w-[100px] items-center border-r-1/2 pr-0 pl-2 h-full">
                    Auth Type
                  </div>
                  <span class="pl-2">{{ selectedLabel }}</span>
                  <ScalarIcon
                    icon="ChevronDown"
                    size="xs" />
                </div>
              </ScalarButton>
            </ScalarComboboxMultiselect>
          </DataTableHeader>
        </DataTableRow>

        <!-- Loop over for multiple auth selection -->
        <template
          v-for="(activeSecurityScheme, index) in activeSecuritySchemes"
          :key="activeSecurityScheme.uid">
          <!-- Header -->
          <DataTableRow v-if="activeSecuritySchemes.length > 1">
            <DataTableCell class="text-c-1 pl-2 text-sm flex items-center">
              {{ selectedAuth[index].label }}:
            </DataTableCell>
          </DataTableRow>

          <!-- HTTP Bearer -->
          <DataTableRow
            v-if="
              activeSecurityScheme.type === 'http' &&
              activeSecurityScheme.scheme === 'bearer'
            ">
            <RequestAuthDataTableInput
              id="http-bearer-token"
              :modelValue="activeSecurityScheme.value"
              placeholder="Token"
              type="password"
              @update:modelValue="
                (v) => updateScheme(activeSecurityScheme, 'value', v)
              ">
              Bearer Token
            </RequestAuthDataTableInput>
          </DataTableRow>

          <!-- HTTP Basic -->
          <template
            v-else-if="
              activeSecurityScheme.type === 'http' &&
              activeSecurityScheme.scheme === 'basic'
            ">
            <DataTableRow>
              <RequestAuthDataTableInput
                id="http-basic-username"
                class="text-c-2"
                :modelValue="activeSecurityScheme.value"
                placeholder="ScalarEnjoyer01"
                @update:modelValue="
                  (v) => updateScheme(activeSecurityScheme, 'value', v)
                ">
                Username
              </RequestAuthDataTableInput>
            </DataTableRow>
            <DataTableRow>
              <RequestAuthDataTableInput
                id="http-basic-password"
                :modelValue="activeSecurityScheme.secondValue"
                placeholder="xxxxxx"
                type="password"
                @update:modelValue="
                  (v) => updateScheme(activeSecurityScheme, 'secondValue', v)
                ">
                Password
              </RequestAuthDataTableInput>
            </DataTableRow>
          </template>

          <!-- API Key -->
          <DataTableRow v-else-if="activeSecurityScheme.type === 'apiKey'">
            <RequestAuthDataTableInput
              :id="`api-key-${activeSecurityScheme.name}`"
              :modelValue="activeSecurityScheme.value"
              placeholder="Value"
              type="password"
              @update:modelValue="
                (v) => updateScheme(activeSecurityScheme, 'value', v)
              ">
              {{ activeSecurityScheme.name }}
            </RequestAuthDataTableInput>
          </DataTableRow>

          <!-- OAuth 2 -->
          <OAuth2
            v-else-if="activeSecurityScheme.type === 'oauth2'"
            :scheme="activeSecurityScheme" />
        </template>
      </DataTable>
    </form>
  </ViewLayoutCollapse>
</template>
