<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
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

const schemeOptions = {
  [Scheme.None]: 'None',
  [Scheme.Bearer]: 'Bearer Authentication (bearerAuth)',
  [Scheme.Basic]: 'Basic Authentication (basicAuth)',
  [Scheme.ApiKeyHeader]: 'API Key (apiKeyHeader)',
  [Scheme.ApiKeyQuery]: 'API Key (apiKeyQuery)',
  [Scheme.ApiKeyCookie]: 'API Key (apiKeyCookie)',
  [Scheme.OAuth2]: 'OAuth 2.0 (oauth2)',
}

const schemeLabel = computed(() => schemeOptions[scheme.value])

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
          <div
            class="items-center justify-start flex rounded px-1.5 w-full h-full text-c-2 group-hover:text-c-1">
            <span>{{ schemeLabel }}</span>
            <ScalarIcon
              class="text-c-3 ml-1 mt-px"
              icon="ChevronDown"
              size="xs" />
          </div>
          <select
            v-model="scheme"
            class="absolute inset-0 w-auto opacity-0"
            @click.prevent>
            <option
              v-for="(label, value) in schemeOptions"
              :key="value"
              :value="value">
              {{ label }}
            </option>
          </select>
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
