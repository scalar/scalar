<script setup lang="ts">
import { type ParamMap, useOperation } from '@scalar/api-client'
import { useKeyboardEvent } from '@scalar/use-keyboard-event'
import { FlowModal, useModal } from '@scalar/use-modal'
import Fuse from 'fuse.js'
import { computed, nextTick, ref, toRef, watch } from 'vue'

import { extractRequestBody } from '../helpers/specHelpers'
import { useTemplateStore } from '../stores/template'
import type { Spec } from '../types'

const props = defineProps<{ spec: Spec }>()
const reactiveSpec = toRef(props, 'spec')
const modalState = useModal()

type FuseData = {
  title: string
  operationId?: string
  description: string
  body?: string | string[] | ParamMap
  httpVerb?: string
  path?: string
  tag?: string
}

let fuseDataArray: FuseData[] = []
const searchResults = ref<Fuse.FuseResult<FuseData>[]>([])
const selectedSearchResult = ref<number>(0)
const searchText = ref<string>('')
const searchModalRef = ref<HTMLElement | null>(null)

const fuse = new Fuse(fuseDataArray, {
  keys: ['title', 'description', 'body'],
})

const { state, setItem, setCollapsedSidebarItem } = useTemplateStore()

const fuseSearch = (): void => {
  selectedSearchResult.value = 0
  searchResults.value = fuse.search(searchText.value)
}

watch(
  () => state.showSearch,
  () => {
    if (state.showSearch) {
      searchText.value = ''
      selectedSearchResult.value = 0
      searchResults.value = []
      modalState.show()
    } else {
      modalState.hide()
    }
  },
)

watch(
  () => modalState.open,
  () => {
    if (!modalState.open) {
      setItem('showSearch', false)
    }
  },
)

async function openSearchResult(entry: Fuse.FuseResult<FuseData>) {
  const tag = entry.item.tag
  const operation = entry.item.operationId

  if (!tag) {
    return
  }

  setCollapsedSidebarItem(tag, true)

  modalState.hide()
  await nextTick()

  const elementId = operation ? `endpoint/${operation}` : `tag/${tag}`
  const element = document.getElementById(elementId)
  element?.scrollIntoView()
}

watch(reactiveSpec.value, () => {
  fuseDataArray = []

  if (!props.spec.tags.length) {
    fuse.setCollection([])
    return
  }

  // TODO: We need to go through the operations, not the tags. Spec files can have zero tags.
  props.spec.tags.forEach((tag) => {
    const tagData = {
      title: tag.name,
      description: tag.description,
      tag: tag.name,
      body: '',
    }
    fuseDataArray.push(tagData)

    if (tag.operations) {
      tag.operations.forEach((operation) => {
        const { parameterMap } = useOperation({ operation })
        const bodyData = extractRequestBody(operation) || parameterMap.value
        let body = null
        if (typeof bodyData !== 'boolean') {
          body = bodyData
        }
        const operationData: FuseData = {
          title: operation.name,
          operationId: operation.operationId,
          description: operation.description,
          httpVerb: operation.httpVerb,
          path: operation.path,
          tag: tag.name,
        }

        if (body) {
          operationData.body = body
        }

        fuseDataArray.push(operationData)
      })
    }
  })

  fuse.setCollection(fuseDataArray)
})

useKeyboardEvent({
  element: searchModalRef,
  keyList: ['enter'],
  active: () => modalState.open,
  handler: () => {
    openSearchResult(
      searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
    )
  },
})

useKeyboardEvent({
  element: searchModalRef,
  keyList: ['ArrowDown'],
  active: () => modalState.open,
  handler: () => {
    if (
      selectedSearchResult.value <
      searchResultsWithPlaceholderResults.value.length - 1
    ) {
      selectedSearchResult.value++
    } else {
      selectedSearchResult.value = 0
    }
  },
})

useKeyboardEvent({
  element: searchModalRef,
  keyList: ['ArrowUp'],
  active: () => modalState.open,
  handler: () => {
    if (selectedSearchResult.value > 0) {
      selectedSearchResult.value--
    } else {
      selectedSearchResult.value =
        searchResultsWithPlaceholderResults.value.length - 1
    }
  },
})

const searchResultsWithPlaceholderResults = computed(
  (): Fuse.FuseResult<FuseData>[] => {
    if (searchText.value.length === 0) {
      return fuseDataArray.map((item) => {
        return {
          item: item,
        } as Fuse.FuseResult<FuseData>
      })
    }

    return searchResults.value
  },
)
</script>
<template>
  <FlowModal :state="modalState">
    <div ref="searchModalRef">
      <input
        v-model="searchText"
        class="ref-search-input"
        placeholder="Search …"
        type="text"
        @input="fuseSearch" />
    </div>
    <div v-if="searchResultsWithPlaceholderResults.length">
      <button
        v-for="(entry, index) in searchResultsWithPlaceholderResults"
        :key="entry.refIndex"
        class="item-entry"
        :class="{
          'item-entry--active': index === selectedSearchResult,
        }"
        type="submit"
        @click="openSearchResult(entry)">
        <div
          v-if="entry.item.title || entry.item.operationId"
          class="item-entry-title">
          {{ entry.item.title || entry.item.operationId }}
        </div>
        <div
          v-if="entry.item.httpVerb || entry.item.path"
          class="item-entry-request">
          <div
            class="item-entry-http-verb"
            :class="`item-entry-http-verb--${entry.item.httpVerb}`">
            {{ entry.item.httpVerb }}
          </div>
          <div class="item-entry-path">
            {{ entry.item.path }}
          </div>
        </div>
        <div v-else-if="entry.item.description">
          {{ entry.item.description }}
        </div>
      </button>
    </div>
  </FlowModal>
</template>
<style scoped>
/** Input */
.ref-search-input {
  width: 100%;
  background: transparent;
  padding: 12px;
  font-size: var(--theme-mini, var(--default-theme-mini));
  outline: none;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  appearance: none;
  margin-bottom: 12px;
}
.ref-search-input::-webkit-input-placeholder,
.ref-search-input::placeholder {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-family: var(--theme-font, var(--default-theme-font));
  font-weight: var(--theme-regular, var(--default-theme-regular));
}
/** Results */
.item-entry {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  padding: 6px 12px;
  width: 100%;
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  text-align: left;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.item-entry--active {
  background: var(--theme-background-2, var(--default-theme-background-2));
  box-shadow: 0 0 0 1px
    var(--theme-background-2, var(--default-theme-background-2));
}
.item-entry:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
  box-shadow: 0 0 0 1px
    var(--theme-background-2, var(--default-theme-background-2));
}

.item-entry-title {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
.item-entry-request {
  display: flex;
  gap: 3px;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.item-entry-http-verb {
  text-transform: uppercase;
}
.item-entry-http-verb--post {
  color: var(--theme-post-color, var(--default-theme-post-color));
}
.item-entry-http-verb--patch {
  color: var(--theme-patch-color, var(--default-theme-patch-color));
}
.item-entry-http-verb--get {
  color: var(--theme-get-color, var(--default-theme-get-color));
}
.item-entry-http-verb--delete {
  color: var(--theme-delete-color, var(--default-theme-delete-color));
}
.item-entry-http-verb--put {
  color: var(--theme-put-color, var(--default-theme-put-color));
}
.item-entry-path {
  color: var(--theme-color-3, var(--default-theme-color-3));
}
</style>
