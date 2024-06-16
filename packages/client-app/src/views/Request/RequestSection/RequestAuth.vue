<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { computed, ref } from 'vue'

defineProps<{
  title: string
}>()

enum Scheme {
  None = 0,
  Bearer = 'bearer',
  Basic = 'basic',
  ApiKeyHeader = 'apiKeyHeader',
  ApiKeyQuery = 'apiKeyQuery',
  ApiKeyCookie = 'apiKeyCookie',
  OAuth2 = 'oauth2',
}

const LAYOUTS = {
  [Scheme.None]: [''],
  [Scheme.Bearer]: [''],
  [Scheme.Basic]: [''],
  [Scheme.ApiKeyHeader]: [''],
  [Scheme.ApiKeyQuery]: [''],
  [Scheme.ApiKeyCookie]: [''],
  [Scheme.OAuth2]: ['', 'auto'],
}

const scheme = ref<Scheme>(Scheme.None)
const user = ref('')
const password = ref('')

const schemeOptions = [
  { id: String(Scheme.None), label: 'None' },
  { id: String(Scheme.Bearer), label: 'Bearer Authentication (bearerAuth)' },
  { id: String(Scheme.Basic), label: 'Basic Authentication (basicAuth)' },
  { id: String(Scheme.ApiKeyHeader), label: 'API Key (apiKeyHeader)' },
  { id: String(Scheme.ApiKeyQuery), label: 'API Key (apiKeyQuery)' },
  { id: String(Scheme.ApiKeyCookie), label: 'API Key (apiKeyCookie)' },
  { id: String(Scheme.OAuth2), label: 'OAuth 2.0 (oauth2)' },
]

const selectedScheme = computed({
  get: () =>
    schemeOptions.find(({ id }) => id === scheme.value) || schemeOptions[0],
  set: (opt) => {
    if (opt?.id) scheme.value = opt.id as Scheme
  },
})

const itemCount = computed(() => {
  if (scheme.value === Scheme.Basic && (user.value || password.value)) return 1
  if (scheme.value !== Scheme.None && password.value) return 1
  return 0
})
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="itemCount">
    <template #title>
      <div class="flex gap-1">
        {{ title }}
      </div>
    </template>
    <DataTable
      class="flex-1"
      :columns="LAYOUTS[scheme]">
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full h-8 cursor-pointer py-[2.25px] px-[2.25px] flex items-center">
          <ScalarListbox
            v-model="selectedScheme"
            class="font-code text-xxs w-full"
            :options="schemeOptions"
            teleport>
            <ScalarButton
              class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
              fullWidth
              variant="ghost">
              <span>{{ selectedScheme?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarListbox>
        </DataTableHeader>
      </DataTableRow>
      <DataTableRow v-if="scheme === Scheme.Bearer">
        <DataTableInput
          v-model="password"
          placeholder="Token"
          type="password">
          Bearer Token
        </DataTableInput>
      </DataTableRow>
      <template v-else-if="scheme === Scheme.Basic">
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
      <DataTableRow v-else-if="scheme === Scheme.ApiKeyHeader">
        <DataTableInput
          v-model="password"
          placeholder="Token"
          type="password">
          Header API
        </DataTableInput>
      </DataTableRow>
      <DataTableRow v-else-if="scheme === Scheme.ApiKeyQuery">
        <DataTableInput
          v-model="password"
          placeholder="Token"
          type="password">
          Query API
        </DataTableInput>
      </DataTableRow>
      <DataTableRow v-else-if="scheme === Scheme.ApiKeyCookie">
        <DataTableInput
          v-model="password"
          placeholder="Token"
          type="password">
          Cookie API
        </DataTableInput>
      </DataTableRow>
      <DataTableRow
        v-else-if="scheme === Scheme.OAuth2"
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
    </DataTable>
  </ViewLayoutCollapse>
</template>
