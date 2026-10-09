<script setup lang="ts">
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableText,
} from '@/v2/components/data-table'
import { CollapsibleSection } from '@/v2/components/layout'
import { useLocalization } from '@/v2/features/localization'

defineProps<{
  cookies: { name: string; value: string }[]
}>()

const { translate } = useLocalization()
</script>
<template>
  <CollapsibleSection
    class="overflow-auto"
    :defaultOpen="false"
    :itemCount="cookies.length">
    <template #title>
      {{ translate('apiClient.responseCookies.cookies') }}
    </template>
    <div
      v-if="cookies.length"
      class="max-h-[calc(100%-32px)] overflow-y-auto">
      <DataTable
        :columns="['minmax(auto, min-content)', 'minmax(50%, 1fr)']"
        scroll>
        <DataTableRow class="sr-only !block">
          <DataTableHeader>
            {{ translate('apiClient.responseCookies.cookieName') }}
          </DataTableHeader>
          <DataTableHeader>
            {{ translate('apiClient.responseCookies.cookieValue') }}
          </DataTableHeader>
        </DataTableRow>
        <DataTableRow
          v-for="(item, index) in cookies"
          :key="item.name"
          class="group/row text-c-1">
          <DataTableText
            class="bg-b-1 sticky left-0 z-1 max-w-full"
            :class="{ 'border-t-0': index === 0 }"
            :text="item.name" />
          <DataTableText
            class="z-0"
            :class="{ 'border-t-0': index === 0 }"
            :text="item.value" />
        </DataTableRow>
      </DataTable>
    </div>
    <!-- Empty state -->
    <div
      v-else
      class="text-c-3 bg-b-1 flex min-h-[64px] items-center justify-center border-t px-4 text-sm">
      {{ translate('apiClient.responseCookies.noCookies') }}
    </div>
  </CollapsibleSection>
</template>
