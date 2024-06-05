<script lang="ts" setup>
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { ScalarCodeBlock, ScalarIcon } from '@scalar/components'
import contentType from 'content-type'
import { computed, nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    active: boolean
    data: any
    headers: { name: string; value: string; required: boolean }[]
  }>(),
  {
    active: false,
    data: null,
  },
)

const mediaType = computed(() => {
  const contentTypeHeader = props.headers.find(
    (header) => header.name.toLowerCase() === 'content-type',
  )

  if (!contentTypeHeader) {
    return null
  }

  try {
    return contentType.parse(contentTypeHeader.value).type
  } catch {
    return null
  }
})

const codeMirrorLanguage = computed((): string | null => {
  if (
    mediaType.value === 'application/json' ||
    mediaType.value === 'application/problem+json' ||
    mediaType.value === 'application/vnd.api+json'
  ) {
    return 'json'
  }

  if (mediaType.value === 'text/html') {
    return 'html'
  }

  if (mediaType.value === 'text/plain') {
    return 'html'
  }

  return null
})

const iframe = ref<HTMLIFrameElement | null>(null)

const activePreview = ref('raw')
const previewOptions = ['raw', 'preview']

watch(
  () => activePreview.value,
  async (newValue) => {
    if (newValue === 'preview') {
      await nextTick()
      if (iframe.value) {
        const doc =
          iframe.value.contentDocument || iframe.value.contentWindow?.document
        if (!doc) return
        doc.open()
        doc.write(props.data)
        doc.close()
      }
    }
  },
)
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>{{ title }}</template>
    <template v-if="active">
      <DataTable :columns="['']">
        <DataTableRow>
          <DataTableHeader
            class="relative col-span-full flex h-[31.5px] cursor-pointer items-center px-[2.25px] py-[2.25px]">
            <div
              class="text-c-2 group-hover:text-c-1 flex h-full w-full items-center justify-start rounded px-1.5">
              <span class="capitalize">{{ activePreview }}</span>
              <ScalarIcon
                class="text-c-3 ml-1 mt-px"
                icon="ChevronDown"
                size="xs" />
            </div>
            <select
              v-model="activePreview"
              class="absolute inset-0 w-auto opacity-0"
              @click.prevent>
              <option
                v-for="value in previewOptions"
                :key="value"
                :value="value">
                {{ value }}
              </option>
            </select>
          </DataTableHeader>
        </DataTableRow>
        <DataTableRow>
          <template v-if="activePreview === 'raw'">
            <ScalarCodeBlock
              v-if="codeMirrorLanguage"
              class="marc rounded-b border-[.5px] border-t-0"
              :content="data"
              :lang="codeMirrorLanguage" />
            <div
              v-else
              class="text-c-3 flex min-h-[58px] w-full items-center justify-center rounded border border-dashed text-center text-base">
              <template v-if="mediaType">
                No Preview Available ({{ mediaType }})
              </template>
              <template v-else>
                Can’t render a preview. The Content-Type header is missing or
                unknown.
              </template>
            </div>
          </template>
          <template v-else>
            <iframe
              ref="iframe"
              allowfullscreen
              class="w-full"
              frameborder="0"></iframe>
          </template>
        </DataTableRow>
      </DataTable>
    </template>
  </ViewLayoutCollapse>
</template>
<style scoped>
.marc {
  max-width: 620px;
}
</style>
