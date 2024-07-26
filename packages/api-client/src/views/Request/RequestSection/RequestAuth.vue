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
  SecuritySchemeOption,
  SecuritySchemeOptionOauth,
} from '@/views/Request/libs'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { SelectedSchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import { camelToTitleWords } from '@scalar/oas-utils/helpers'
import { capitalize, computed } from 'vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  activeSecurityRequirements,
  activeSecuritySchemes,
  collectionMutators,
  isReadOnly,
  securitySchemeMutators,
  securitySchemes,
} = useWorkspace()

/** Generate pretty name for the dropdown label */
const getLabel = (id: string) => {
  const scheme = securitySchemes[id]

  switch (scheme?.type) {
    case 'apiKey':
      return `${capitalize(scheme.in)}`
    case 'http': {
      return `${capitalize(scheme.scheme)} Authentication`
    }
    case 'openIdConnect':
      return `Open ID Connect`
    default:
      return 'None'
  }
}

/** Generate the options for the dropdown */
const schemeOptions = computed<SecuritySchemeOption[]>(() => {
  // For the client app we provide all options
  const additionalAuth = isReadOnly.value
    ? []
    : [
        // {
        //   id: 'apiKeyCookie',
        //   label: 'API Key in Cookies',
        // },
        // {
        //   id: 'apiKeyHeader',
        //   label: 'API Key in Headers',
        // },
        // {
        //   id: 'apiKeyQuery',
        //   label: 'API Key in Query Params',
        // },
        // {
        //   id: 'httpBasic',
        //   label: 'HTTP Basic',
        // },
        // {
        //   id: 'httpBearer',
        //   label: 'HTTP Bearer',
        // },
        // {
        //   id: 'oauth2Implicit',
        //   label: 'Oauth2 Implicit Flow',
        // },
        // {
        //   id: 'oauth2Password',
        //   label: 'Oauth2 Password Flow',
        // },
        // {
        //   id: 'oauth2ClientCredentials',
        //   label: 'Oauth2 Client Credentials',
        // },
        // {
        //   id: 'oauth2AuthorizationFlow',
        //   label: 'Oauth2 Authorization Flow',
        // },
        // {
        //   id: 'oauth2Implicit',
        //   label: 'Oauth2 Implicit Flow',
        // },
      ]

  return [
    ...activeSecurityRequirements.value.flatMap((req) => {
      const keys = Object.keys(req)

      // Optional
      if (keys.length === 0)
        return { id: 'none', label: 'None', labelWithoutId: 'None' }

      // Active requirements
      return keys.flatMap((id) => {
        const scheme = securitySchemes[id]

        // For OAuth2 add all flows
        if (scheme?.type === 'oauth2') {
          return Object.keys(scheme.flows).map((flowKey) => ({
            // Since ID's must be unique, we also store the uid and flowKey separately
            id: `${id}${flowKey}`,
            label: `${camelToTitleWords(flowKey)} (${id})`,
            labelWithoutId: camelToTitleWords(flowKey),
            flowKey,
            uid: id,
          }))
        }
        // Or add just a single item
        else
          return {
            id,
            labelWithoutId: getLabel(id),
            label: `${getLabel(id)} (${id})`,
          }
      })
    }),
    ...additionalAuth,
  ]
})

const schemeModel = computed({
  // Grab the selected OR first security scheme
  get: () =>
    schemeOptions.value.filter(({ id }) =>
      activeCollection.value?.selectedSecuritySchemes?.find(
        (scheme) => id === `${scheme.uid}${scheme.flowKey ?? ''}`,
      ),
    ) || [schemeOptions.value[0]],

  // Update the mutator on set
  set: (options) => {
    // Handle the case for OAuth flow
    const payload = options.map((opt) =>
      'uid' in opt ? { flowKey: opt.flowKey, uid: opt.uid } : { uid: opt.id },
    )

    collectionMutators.edit(
      activeCollection.value!.uid,
      'selectedSecuritySchemes',
      payload,
    )
  },
})

type UpdateSchemeParams = Parameters<UpdateScheme>

/** Update the selected scheme */
const updateScheme = (
  scheme: (typeof activeSecuritySchemes)['value'][number],
  path: UpdateSchemeParams[0],
  value: UpdateSchemeParams[1],
) => securitySchemeMutators.edit(scheme.scheme.uid ?? '', path, value)

/** Combine values from all selected options */
const selectedLabel = computed(() => {
  if (schemeModel.value.length > 1)
    return schemeModel.value
      .map(({ labelWithoutId }) => labelWithoutId)
      .join(', ')
  else if (schemeModel.value.length) return schemeModel.value[0].label
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
            <ScalarListbox
              v-model="schemeModel"
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
            </ScalarListbox>
          </DataTableHeader>
        </DataTableRow>

        <!-- Loop over for multiple auth selection -->
        <template
          v-for="(activeSecurityScheme, index) in activeSecuritySchemes"
          :key="activeSecurityScheme.scheme.uid">
          <!-- Header -->
          <DataTableRow v-if="activeSecuritySchemes.length > 1">
            <DataTableCell class="text-c-1 pl-2 text-sm flex items-center">
              {{ schemeModel[index].label }}:
            </DataTableCell>
          </DataTableRow>

          <!-- HTTP Bearer -->
          <DataTableRow
            v-if="
              activeSecurityScheme.scheme.type === 'http' &&
              activeSecurityScheme.scheme.scheme === 'bearer'
            ">
            <RequestAuthDataTableInput
              id="http-bearer-token"
              :modelValue="activeSecurityScheme.scheme.value"
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
              activeSecurityScheme.scheme.type === 'http' &&
              activeSecurityScheme.scheme.scheme === 'basic'
            ">
            <DataTableRow>
              <RequestAuthDataTableInput
                id="http-basic-username"
                class="text-c-2"
                :modelValue="activeSecurityScheme.scheme.value"
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
                :modelValue="activeSecurityScheme.scheme.secondValue"
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
          <DataTableRow
            v-else-if="activeSecurityScheme.scheme.type === 'apiKey'">
            <RequestAuthDataTableInput
              :id="`api-key-${activeSecurityScheme.scheme.name}`"
              :modelValue="activeSecurityScheme.scheme.value"
              placeholder="Value"
              type="password"
              @update:modelValue="
                (v) => updateScheme(activeSecurityScheme, 'value', v)
              ">
              {{ activeSecurityScheme.scheme.name }}
            </RequestAuthDataTableInput>
          </DataTableRow>

          <!-- OAuth 2 -->
          <OAuth2
            v-else-if="
              activeSecurityScheme.scheme.type === 'oauth2' &&
              schemeModel[index] &&
              'uid' in schemeModel[index] &&
              activeSecurityScheme.flow
            "
            :activeScheme="activeSecurityScheme as SelectedSchemeOauth2"
            :schemeModel="schemeModel[index] as SecuritySchemeOptionOauth" />
        </template>
      </DataTable>
    </form>
  </ViewLayoutCollapse>
</template>
