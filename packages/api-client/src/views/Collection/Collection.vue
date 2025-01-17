<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { reactive } from 'vue'

const data = reactive<{ key: string; value: string; enabled: boolean }[]>([
  { key: 'key 1', value: 'value 1', enabled: true },
  { key: 'key 2', value: 'value 2', enabled: false },
  { key: '', value: '', enabled: false },
])
</script>
<template>
  <ViewLayout>
    <Sidebar title="Collection" />
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <template #title>Section 1</template>
        <div class="flex flex-col p-2">
          <DataTable :columns="['', '', 'auto']">
            <DataTableRow>
              <DataTableHeader>First Header</DataTableHeader>
              <DataTableHeader>
                Long header that needs to be truncated
              </DataTableHeader>
              <DataTableHeader class="flex justify-center">
                &plus;
              </DataTableHeader>
            </DataTableRow>
            <DataTableRow
              v-for="item in data"
              :key="item.key">
              <DataTableCheckbox v-model="item.enabled" />
              <DataTableInput
                v-model="item.key"
                placeholder="Key" />
              <DataTableInput
                v-model="item.value"
                placeholder="Value" />
            </DataTableRow>
            <DataTableRow>
              <DataTableCell>Static Text</DataTableCell>
              <DataTableCell>
                Long static text that needs to wrap to the next line
              </DataTableCell>
              <DataTableCell />
            </DataTableRow>
            <DataTableRow class="h-24">
              <DataTableCell class="col-span-full">
                Static row with fixed height and full column span.
              </DataTableCell>
            </DataTableRow>
          </DataTable>
        </div>
      </ViewLayoutSection>
      <ViewLayoutSection>
        <template #title>Section 2</template>
        <pre class="whitespace-pre p-4">{{ data }}</pre>
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>
<style scoped></style>
