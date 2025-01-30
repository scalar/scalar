<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { getRequestData } from '@/libs/send-request/send-request'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { safeJSON } from '@scalar/object-utils/parse'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { computed, onMounted, ref, watch } from 'vue'

const { activeRequest, activeExample, activeCollection, activeEnvironment } =
  useActiveEntities()
const { cookies } = useWorkspace()

const { plugins, print } = snippetz()

const selectedTarget = ref<TargetId>('node' as const)
const selectedClient = ref<ClientId<typeof selectedTarget.value>>('undici')

const requestContent = ref('')

/** Get the request snippet */
const requestSnippet = async () => {
  if (!activeRequest.value || !activeExample.value || !activeCollection.value)
    return ''

  const environmentValue =
    typeof activeEnvironment.value === 'object'
      ? activeEnvironment.value.value
      : '{}'
  const e = safeJSON.parse(environmentValue)
  const environment =
    e.error || typeof e.data !== 'object' ? {} : (e.data ?? {})

  const requestData = getRequestData({
    request: activeRequest.value,
    example: activeExample.value,
    environment,
    globalCookies: Object.values(cookies),
  })

  requestContent.value =
    print(selectedTarget.value, selectedClient.value, {
      method: requestData.method,
      url: requestData.url,
      headers: Object.entries(requestData.headers).map(([key, value]) => ({
        name: key,
        value,
      })),
      postData: {
        mimeType: requestData.headers['Content-Type'] ?? 'application/json',
        text: requestData.body ? JSON.stringify(requestData.body) : '{}',
      },
      cookies: requestData.cookies,
    }) ?? ''

  return requestContent.value
}

/** Available plugins */
const availablePlugins = computed(() => {
  return plugins().map(
    (plugin) =>
      ({
        id: `${plugin.target}-${plugin.client}`,
        label: `${plugin.target} / ${plugin.client}`,
      }) as ScalarListboxOption,
  )
})

/** Selected plugin */
const selectedPlugin = computed({
  get: () =>
    availablePlugins.value.find((plugin) => {
      return plugin.id === `${selectedTarget.value}-${selectedClient.value}`
    }),
  set: (plugin: ScalarListboxOption) => {
    const [target, client] = plugin.id.split('-') as [
      TargetId,
      ClientId<TargetId>,
    ]
    selectedTarget.value = target
    selectedClient.value = client
  },
})

onMounted(async () => {
  await requestSnippet()
})

/** On request change */
watch(requestSnippet, () => {
  requestSnippet()
})

/** On request navigation change */
watch(activeRequest, () => {
  requestSnippet()
})
</script>

<template>
  <div class="sticky mt-auto bottom-0 w-full">
    <ViewLayoutCollapse
      class="group/preview -mt-0.25 w-full"
      :defaultOpen="false"
      :hasIcon="false">
      <template #title> Code Snippet </template>
      <template #actions>
        <div class="flex flex-1 -mx-1">
          <ScalarListbox
            v-model="selectedPlugin"
            :options="availablePlugins"
            placement="bottom-end">
            <ScalarButton
              class="flex gap-1.5 h-full px-1.5 py-0.75 text-c-2 font-normal text-c-1 w-fit"
              fullWidth
              variant="ghost">
              <span>{{ selectedTarget }}/{{ selectedClient }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="md" />
            </ScalarButton>
          </ScalarListbox>
        </div>
      </template>
      <DataTable :columns="['']">
        <DataTableRow>
          <div
            class="bg-b-1 border-t flex items-center justify-center overflow-hidden">
            <ScalarCodeBlock
              class="max-h-40 px-1 py-1.5 w-full"
              :content="requestContent"
              :lang="selectedTarget"
              lineNumbers />
          </div>
        </DataTableRow>
      </DataTable>
    </ViewLayoutCollapse>
  </div>
</template>
<style scoped>
:deep(code.hljs *) {
  font-size: var(--scalar-mini);
}
</style>
