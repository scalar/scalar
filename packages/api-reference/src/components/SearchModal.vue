<script setup lang="ts">
import {
  type Icon,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import type { TransformedOperation } from '@scalar/oas-utils'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { FlowModal, type ModalState } from '@scalar/use-modal'
import { useMagicKeys, whenever } from '@vueuse/core'
import Fuse from 'fuse.js'
import { computed, ref, toRef, watch } from 'vue'

import { getHeadingsFromMarkdown, getModels } from '../helpers'
import { extractRequestBody } from '../helpers/specHelpers'
import { type ParamMap, useNavState, useOperation, useSidebar } from '../hooks'
import type { Spec } from '../types'
import SidebarHttpBadge from './Sidebar/SidebarHttpBadge.vue'

type EntryType = 'req' | 'webhook' | 'model' | 'heading' | 'tag'

const props = defineProps<{
  parsedSpec: Spec
  modalState: ModalState
}>()
const reactiveSpec = toRef(props, 'parsedSpec')

const ENTRY_ICONS: { [x in EntryType]: Icon } = {
  heading: 'DocsPage',
  model: 'JsonObject',
  req: 'Terminal',
  tag: 'CodeFolder',
  webhook: 'Terminal',
}

const keys = useMagicKeys()

type FuseData = {
  title: string
  href: string
  type: EntryType
  operationId?: string
  description: string
  body?: string | string[] | ParamMap
  httpVerb?: string
  path?: string
  tag?: string
  operation?: TransformedOperation
}

const fuseDataArray = ref<FuseData[]>([])
const searchResults = ref<Fuse.FuseResult<FuseData>[]>([])
const selectedSearchResult = ref<number>(0)
const searchText = ref<string>('')
const searchModalRef = ref<HTMLElement | null>(null)

const fuse = new Fuse(fuseDataArray.value, {
  keys: ['title', 'description', 'body'],
})

const fuseSearch = (): void => {
  selectedSearchResult.value = 0
  searchResults.value = fuse.search(searchText.value)
}

const selectedEntry = computed<Fuse.FuseResult<FuseData>>(
  () => searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
)

const { getHeadingId, getWebhookId, getModelId, getOperationId, getTagId } =
  useNavState()

watch(
  () => props.modalState.open,
  (open) => {
    if (!open) return
    searchText.value = ''
    selectedSearchResult.value = 0
    searchResults.value = []
  },
)

const { setCollapsedSidebarItem, hideModels } = useSidebar()

watch(
  reactiveSpec.value,
  async () => {
    fuseDataArray.value = []

    // Likely an incomplete/invalid spec
    if (!props.parsedSpec?.tags?.length && !props.parsedSpec?.webhooks) {
      fuse.setCollection([])
      return
    }

    // Headings from the description
    const headingsData: FuseData[] = []
    const headings = await getHeadingsFromMarkdown(
      props.parsedSpec.info?.description ?? '',
    )

    if (headings.length) {
      headings.forEach((heading) => {
        headingsData.push({
          type: 'heading',
          title: `Info > ${heading.value}`,
          description: '',
          href: `#${getHeadingId(heading)}`,
          tag: heading.slug,
          body: '',
        })
      })

      fuseDataArray.value = fuseDataArray.value.concat(headingsData)
    }

    // Tags
    props.parsedSpec.tags?.forEach((tag) => {
      const tagData: FuseData = {
        title: tag.name,
        href: `#${getTagId(tag)}`,
        description: tag.description,
        type: 'tag',
        tag: tag.name,
        body: '',
      }

      fuseDataArray.value.push(tagData)

      if (tag.operations) {
        tag.operations.forEach((operation) => {
          const { parameterMap } = useOperation({ operation })
          const bodyData = extractRequestBody(operation) || parameterMap.value
          let body = null
          if (typeof bodyData !== 'boolean') {
            body = bodyData
          }

          const operationData: FuseData = {
            type: 'req',
            title: operation.name ?? operation.path,
            href: `#${getOperationId(operation, tag)}`,
            operationId: operation.operationId,
            description: operation.description ?? '',
            httpVerb: operation.httpVerb,
            path: operation.path,
            tag: tag.name,
            operation,
          }

          if (body) {
            operationData.body = body
          }

          fuseDataArray.value.push(operationData)
        })
      }
    })

    // Adding webhooks
    const webhooks = props.parsedSpec.webhooks
    const webhookData: FuseData[] = []

    if (webhooks) {
      Object.keys(webhooks).forEach((name) => {
        const httpVerbs = Object.keys(
          webhooks[name],
        ) as OpenAPIV3_1.HttpMethods[]

        httpVerbs.forEach((httpVerb) => {
          webhookData.push({
            type: 'webhook',
            title: `Webhook: ${webhooks[name][httpVerb]?.name}`,
            href: `#${getWebhookId(name, httpVerb)}`,
            description: name,
            httpVerb,
            tag: name,
            body: '',
          })
        })

        fuseDataArray.value = fuseDataArray.value.concat(webhookData)
      })
    }

    // Adding models as well
    const schemas = hideModels.value ? {} : getModels(props.parsedSpec)
    const modelData: FuseData[] = []

    if (schemas) {
      Object.keys(schemas).forEach((k) => {
        modelData.push({
          type: 'model',
          title: 'Model',
          href: `#${getModelId(k)}`,
          description: (schemas[k] as any).title ?? k,
          tag: k,
          body: '',
        })
      })

      fuseDataArray.value = fuseDataArray.value.concat(modelData)
    }

    fuse.setCollection(fuseDataArray.value)
  },
  { immediate: true },
)

whenever(keys.enter, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  onSearchResultClick(selectedEntry.value)
  window.location.hash = selectedEntry.value.item.href
  props.modalState.hide()
})

whenever(keys.ArrowDown, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  if (
    selectedSearchResult.value <
    searchResultsWithPlaceholderResults.value.length - 1
  ) {
    selectedSearchResult.value++
  } else {
    selectedSearchResult.value = 0
  }

  document.getElementById(selectedEntry.value.item.href)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
})

whenever(keys.ArrowUp, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  if (selectedSearchResult.value > 0) {
    selectedSearchResult.value--
  } else {
    selectedSearchResult.value =
      searchResultsWithPlaceholderResults.value.length - 1
  }

  document.getElementById(selectedEntry.value.item.href)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
})

const searchResultsWithPlaceholderResults = computed(
  (): Fuse.FuseResult<FuseData>[] => {
    if (searchText.value.length === 0) {
      return fuseDataArray.value.map((item) => {
        return {
          item: item,
        } as Fuse.FuseResult<FuseData>
      })
    }

    return searchResults.value
  },
)

const tagRegex = /#(tag\/[^/]*)/

// Ensure we open the section
const onSearchResultClick = (entry: Fuse.FuseResult<FuseData>) => {
  let parentId = 'models'
  const tagMatch = entry.item.href.match(tagRegex)

  if (tagMatch?.length && tagMatch.length > 1) {
    parentId = tagMatch[1]
  }
  setCollapsedSidebarItem(parentId, true)
  props.modalState.hide()
}

// given just a #hash-name, we grab the full URL to be explicit to
// handle edge cases of other framework routers resetting to base URL on navigation
function getFullUrlFromHash(href: string) {
  const newUrl = new URL(window.location.href)

  newUrl.hash = href

  return newUrl.toString()
}
</script>
<template>
  <FlowModal
    :state="modalState"
    variant="search">
    <div
      ref="searchModalRef"
      class="ref-search-container">
      <ScalarSearchInput
        v-model="searchText"
        @input="fuseSearch" />
    </div>
    <ScalarSearchResultList
      class="ref-search-results custom-scroll"
      :noResults="!searchResultsWithPlaceholderResults.length">
      <ScalarSearchResultItem
        v-for="(entry, index) in searchResultsWithPlaceholderResults"
        :id="entry.item.href"
        :key="entry.refIndex"
        :active="selectedSearchResult === index"
        :href="getFullUrlFromHash(entry.item.href)"
        :icon="ENTRY_ICONS[entry.item.type]"
        @click="onSearchResultClick(entry)"
        @focus="selectedSearchResult = index">
        {{ entry.item.title }}
        <template
          v-if="
            (entry.item.httpVerb || entry.item.path) &&
            entry.item.path !== entry.item.title
          "
          #description>
          {{ entry.item.path }}
        </template>
        <template
          v-else-if="entry.item.description"
          #description>
          {{ entry.item.description }}
        </template>
        <template
          v-if="entry.item.type === 'req'"
          #addon>
          <SidebarHttpBadge :method="entry.item.httpVerb ?? 'get'" />
        </template>
      </ScalarSearchResultItem>
      <template #query>{{ searchText }}</template>
    </ScalarSearchResultList>
    <div class="ref-search-meta">
      <span>↑↓ Navigate</span>
      <span>⏎ Select</span>
    </div>
  </FlowModal>
</template>
<style scoped>
a {
  text-decoration: none;
}
.ref-search-container {
  display: flex;
  flex-direction: column;
  padding: 12px;
  padding-bottom: 0px;
}
.ref-search-results {
  padding: 12px;
}
.ref-search-meta {
  background: var(--scalar-background-3);
  padding: 6px 12px;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  display: flex;
  gap: 12px;
}
</style>
