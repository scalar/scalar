<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store/workspace'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { cookies, activeCookieId, cookieMutators } = useWorkspace()

const item = ref('')

const options = [
  {
    label: 'Key',
    key: 'key',
    placeholder: 'Username',
  },
  {
    label: 'Value',
    key: 'value',
    placeholder: '123',
  },
  {
    label: 'Domain',
    key: 'domain',
    placeholder: 'scalar.com',
  },
  {
    label: 'Path',
    key: 'path',
    placeholder: '/',
  },
  {
    label: 'Expires',
    key: 'expires',
    placeholder: 'Tomorrow',
  },
  {
    label: 'Secure',
    key: 'secure',
    placeholder: 'True/False',
  },
  {
    label: 'HttpOnly',
    key: 'httpOnly',
    placeholder: 'True/False',
  },
]
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <span>Cookie</span>
    </template>
    <div class="custom-scroll flex flex-1 flex-col gap-1.5 p-2">
      <DataTable
        v-if="activeCookieId && cookies[activeCookieId]"
        class="border-t"
        :columns="['']">
        <DataTableRow
          v-for="(option, index) in options"
          :key="index"
          :class="{ 'border-t': index === 0 }">
          <DataTableInput
            :modelValue="
              String(cookies[activeCookieId][option.key as keyof Cookie] ?? '')
            "
            :placeholder="option.label"
            @update:modelValue="
              cookieMutators.edit(
                activeCookieId,
                option.key as keyof Cookie,
                $event,
              )
            ">
            {{ option.label }}
          </DataTableInput>
        </DataTableRow>
      </DataTable>
    </div>
  </ViewLayoutSection>
</template>
