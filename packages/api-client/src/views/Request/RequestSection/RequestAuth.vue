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
import {
  ADD_AUTH_DICT,
  ADD_AUTH_OPTIONS,
  type SecuritySchemeGroup,
  type SecuritySchemeOption,
} from '@/views/Request/consts'
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
const schemeOptions = computed<SecuritySchemeOption[] | SecuritySchemeGroup[]>(
  () => {
    const securitySchemesDict = activeCollection.value?.securitySchemeDict

    /** Security options from the spec */
    const specOptions = activeSecurityRequirements.value.flatMap((req) => {
      const keys = Object.keys(req)

      // Optional
      if (keys.length === 0 && isReadOnly.value)
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

    // For the modal we only provide available auth
    if (isReadOnly.value) {
      return specOptions
    }
    // For the client app we provide all options
    else {
      const options = activeRequest.value.securitySchemeUids.map((uid) => {
        const scheme = securitySchemes[uid]
        const label = getLabel(scheme)

        return {
          id: uid,
          label:
            'name' in scheme && scheme.name.length
              ? `${label} (${scheme.name})`
              : label,
          labelWithoutId: label,
        }
      })

      return [
        { label: 'Select auth', options: [...specOptions, ...options] },
        {
          label: 'Add new auth',
          options: ADD_AUTH_OPTIONS,
        },
      ] as const
    }
  },
)

const selectedAuth = computed({
  // Grab the selected OR first security scheme
  get: () => {
    // Convert groups or arrays into one nice array for checking
    const flattenedOptions = schemeOptions.value.flatMap((schemeOption) =>
      'options' in schemeOption ? schemeOption.options : schemeOption,
    )

    // Return all schemes selected on this request
    return flattenedOptions.filter(({ id }) =>
      activeRequest.value?.selectedSecuritySchemeUids?.find(
        (uid) => uid === id,
      ),
    )
  },

  // Update the selected auth per this request
  set: (options) => {
    const newAuthOption = options.find(
      (val) => ADD_AUTH_DICT[val.id as keyof typeof ADD_AUTH_DICT],
    )

    // Add new auth
    if (newAuthOption?.payload && activeCollection.value) {
      // Closing the popup as we don't want to keep selecting
      comboboxRef.value?.comboboxPopoverRef?.popoverButtonRef?.el?.click()

      securitySchemeMutators.add(
        newAuthOption.payload,
        activeCollection.value.uid,
        activeRequest.value,
        true,
      )
    }
    // Select existing auth
    else {
      requestMutators.edit(
        activeRequest.value.uid,
        'selectedSecuritySchemeUids',
        options.map((opt) => opt.id),
      )
    }
  },
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

/** Delete scheme */
const handleDelete = (scheme: SecurityScheme) =>
  securitySchemeMutators.delete(scheme, activeRequest.value)
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
              class="text-xs w-full"
              fullWidth
              multiple
              :options="schemeOptions"
              style="margin-left: 120px"
              teleport>
              <ScalarButton
                class="h-auto py-0 px-0 text-c-2 hover:text-c-1 font-normal justify-start"
                fullWidth
                variant="ghost">
                <div
                  class="text-c-2 h-8 flex min-w-[120px] items-center border-r-1/2 pr-0 pl-2">
                  Auth Type
                </div>
                <span class="pl-2">{{ selectedLabel }}</span>
                <ScalarIcon
                  icon="ChevronDown"
                  size="xs" />
              </ScalarButton>
            </ScalarComboboxMultiselect>
          </DataTableHeader>
        </DataTableRow>

        <!-- Loop over for multiple auth selection -->
        <template
          v-for="(scheme, index) in activeSecuritySchemes"
          :key="scheme.uid">
          <!-- Header -->
          <DataTableRow
            v-if="activeSecuritySchemes.length > 1"
            class="group/delete">
            <DataTableCell
              class="text-c-2 pl-2 text-xs font-medium flex items-center justify-between bg-b-2">
              {{ selectedAuth[index]?.label }}

              <div
                class="text-c-2 flex whitespace-nowrap opacity-0 group-hover/delete:opacity-100 request-meta-buttons pr-2">
                <ScalarButton
                  class="px-1 transition-none"
                  size="sm"
                  variant="ghost"
                  @click.stop="handleDelete(scheme)">
                  Delete
                </ScalarButton>
              </div>
            </DataTableCell>
          </DataTableRow>

          <!-- HTTP -->
          <template v-if="scheme.type === 'http'">
            <!-- Bearer -->
            <DataTableRow v-if="scheme.scheme === 'bearer'">
              <RequestAuthDataTableInput
                :id="`http-bearer-token-${scheme.uid}`"
                :modelValue="scheme.value"
                placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
                type="password"
                @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
                Bearer Token
              </RequestAuthDataTableInput>
            </DataTableRow>

            <!-- HTTP Basic -->
            <template v-else-if="scheme.scheme === 'basic'">
              <DataTableRow>
                <RequestAuthDataTableInput
                  :id="`http-basic-username-${scheme.uid}`"
                  class="text-c-2"
                  :modelValue="scheme.value"
                  placeholder="ScalarEnjoyer01"
                  required
                  @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
                  Username
                </RequestAuthDataTableInput>
              </DataTableRow>
              <DataTableRow>
                <RequestAuthDataTableInput
                  :id="`http-basic-password-${scheme.uid}`"
                  :modelValue="scheme.secondValue"
                  placeholder="xxxxxx"
                  type="password"
                  @update:modelValue="
                    (v) => updateScheme(scheme, 'secondValue', v)
                  ">
                  Password
                </RequestAuthDataTableInput>
              </DataTableRow>
            </template>
          </template>

          <!-- API Key -->
          <template v-else-if="scheme.type === 'apiKey'">
            <!-- Custom auth -->
            <template v-if="!isReadOnly">
              <DataTableRow>
                <RequestAuthDataTableInput
                  :id="`api-key-name-${scheme.uid}`"
                  :modelValue="scheme.name"
                  placeholder="api-key"
                  @update:modelValue="(v) => updateScheme(scheme, 'name', v)">
                  Name
                </RequestAuthDataTableInput>
              </DataTableRow>
              <DataTableRow>
                <RequestAuthDataTableInput
                  :id="`api-key-value-add-${scheme.uid}`"
                  :modelValue="scheme.value"
                  placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
                  @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
                  Value
                </RequestAuthDataTableInput>
              </DataTableRow>
            </template>

            <DataTableRow v-else>
              <RequestAuthDataTableInput
                :id="`api-key-value-${scheme.uid}`"
                :modelValue="scheme.value"
                placeholder="Value"
                @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
                {{ scheme.name }}
              </RequestAuthDataTableInput>
            </DataTableRow>
          </template>

          <!-- OAuth 2 -->
          <OAuth2
            v-else-if="scheme.type === 'oauth2'"
            :scheme="scheme" />
        </template>
      </DataTable>
    </form>
  </ViewLayoutCollapse>
</template>
<style scoped>
.auth-combobox-position {
  margin-left: 120px;
}
</style>
