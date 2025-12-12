<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import { CollapsibleSection } from '@/v2/components/layout'

defineProps<{
  cookies: { name: string; value: string }[]
}>()
</script>
<template>
  <CollapsibleSection
    :defaultOpen="false"
    :itemCount="cookies.length">
    <template #title>Cookies</template>
    <template v-if="true">
      <DataTable
        v-if="cookies.length"
        class="flex-1"
        :columns="['', '']">
        <DataTableRow
          v-for="item in cookies"
          :key="item.name">
          <DataTableText :text="item.name" />
          <DataTableText :text="item.value" />
        </DataTableRow>
      </DataTable>
      <!-- Empty state -->
      <div
        v-else
        class="text-c-3 bg-b-1 flex min-h-[64px] items-center justify-center border-t px-4 text-sm">
        No cookies
      </div>
    </template>
  </CollapsibleSection>
</template>
