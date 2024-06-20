<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { computed, ref } from 'vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  collectionMutators,
  activeSecurityRequirements,
  securitySchemes,
} = useWorkspace()

// const LAYOUTS = {
//   'none': [''],
//   '': [''],
//   [Scheme.Basic]: [''],
//   [Scheme.ApiKeyHeader]: [''],
//   [Scheme.ApiKeyQuery]: [''],
//   [Scheme.ApiKeyCookie]: [''],
//   [Scheme.OAuth2]: ['', 'auto'],
// } as const
//

/** Generate pretty name for the dropdown label */
const getPrettyName = (id: string) => {
  const scheme = securitySchemes[id]

  switch (scheme.type) {
    case 'apiKey':
      return `API id (${id})`
    case 'http': {
      const name = scheme.scheme[0].toUpperCase() + scheme.scheme.slice(1)
      return `${name} Authentication (${id})`
    }
    case 'oauth2':
      return `OAuth 2.0 (${id})`
    case 'openIdConnect':
      return `Open ID Connect (${id})`
    default:
      return 'None'
  }
}

const user = ref('')
const password = ref('')
const schemeOptions = computed(() =>
  activeSecurityRequirements.value.flatMap((req) =>
    Object.keys(req).map((id) =>
      id === 'none' ? { id, label: 'None' } : { id, label: getPrettyName(id) },
    ),
  ),
)

const activeScheme = computed(
  () => securitySchemes[schemeModal.value?.id ?? ''],
)

const schemeModal = computed({
  get: () =>
    schemeOptions.value.find(
      ({ id }) =>
        id ===
        (activeCollection.value?.selectedSecurityKeys[0] ??
          schemeOptions.value[0].id),
    ),
  set: (opt) =>
    opt?.id &&
    collectionMutators.edit(
      activeCollection.value!.uid,
      'selectedSecurityKeys',
      [opt.id],
    ),
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
    <DataTable
      class="flex-1"
      :columns="['']">
      <!-- :columns="LAYOUTS[scheme]"> -->
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full h-8 cursor-pointer py-[2.25px] px-[2.25px] flex items-center">
          <ScalarListbox
            v-model="schemeModal"
            class="font-code text-xxs w-full"
            :options="schemeOptions"
            teleport>
            <ScalarButton
              class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
              fullWidth
              variant="ghost">
              <span>{{ schemeModal?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarListbox>
        </DataTableHeader>
      </DataTableRow>
      <DataTableRow
        v-if="
          activeScheme?.type === 'http' && activeScheme.scheme === 'bearer'
        ">
        <DataTableInput
          v-model="password"
          placeholder="Token"
          type="password">
          Bearer Token
        </DataTableInput>
      </DataTableRow>
      <template
        v-else-if="
          activeScheme?.type === 'http' && activeScheme.scheme === 'basic'
        ">
        <DataTableRow>
          <DataTableInput
            v-model="user"
            class="text-c-2"
            placeholder="Username">
            Username
          </DataTableInput>
        </DataTableRow>
        <DataTableRow>
          <DataTableInput
            v-model="password"
            placeholder="Token"
            type="password">
            Password
          </DataTableInput>
        </DataTableRow>
      </template>
      <DataTableRow v-else-if="activeScheme?.type === 'apiKey'">
        <DataTableInput
          v-model="password"
          placeholder="Token"
          type="password">
          Header API
        </DataTableInput>
      </DataTableRow>
      <DataTableRow
        v-else-if="activeScheme?.type === 'oauth2'"
        class="border-r-transparent">
        <DataTableInput
          v-model="password"
          placeholder="Token">
          Client ID
        </DataTableInput>
        <DataTableCell class="flex items-center">
          <ScalarButton
            class="mr-[2.25px]"
            size="sm">
            Authorize
          </ScalarButton>
        </DataTableCell>
      </DataTableRow>
      <DataTableRow
        v-else-if="activeScheme?.type === 'openIdConnect'"
        class="border-r-transparent">
        <DataTableInput
          v-model="password"
          placeholder="Token">
          TODO
        </DataTableInput>
        <DataTableCell class="flex items-center">
          <ScalarButton
            class="mr-[2.25px]"
            size="sm">
            Authorize
          </ScalarButton>
        </DataTableCell>
      </DataTableRow>
    </DataTable>
  </ViewLayoutCollapse>
</template>
