<script setup lang="ts">
import { type ParamMap, useOperation } from '@scalar/api-client'
import Fuse from 'fuse.js'
import { nextTick, ref, toRef, watch } from 'vue'

import { extractRequestBody } from '../helpers/specHelpers'
import { useTemplateStore } from '../stores/template'
import type { Spec } from '../types'
import FlowModal, { useModalState } from './FlowModal.vue'

const props = defineProps<{ spec: Spec }>()
const reactiveSpec = toRef(props, 'spec')
const modalState = useModalState()
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
const fuseSearchResults = ref<Fuse.FuseResult<FuseData>[]>([])
const searchText = ref<string>('')

const fuse = new Fuse(fuseDataArray, {
  keys: ['title', 'description', 'body'],
})

const { state, setItem, setCollapsedSidebarItem } = useTemplateStore()

const fuseSearch = (): void => {
  fuseSearchResults.value = fuse.search(searchText.value)
}

watch(
  () => state.showSearch,
  () => {
    if (state.showSearch) {
      searchText.value = ''
      fuseSearchResults.value = []
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

async function handleHyperLinkClick(
  operation: string | undefined,
  tag: string | undefined,
) {
  if (!operation || !tag) {
    return
  }
  setCollapsedSidebarItem(tag, true)

  modalState.hide()

  await nextTick()

  const elementId = `endpoint/${operation}`
  const element = document.getElementById(elementId)
  element?.scrollIntoView()
}

watch(reactiveSpec.value, () => {
  fuseDataArray = []
  props.spec.tags.forEach((tag) => {
    const payload = {
      title: tag.name,
      description: tag.description,
      body: '',
    }
    fuseDataArray.push(payload)

    if (tag.operations) {
      tag.operations.forEach((operation) => {
        const { parameterMap } = useOperation({ operation })
        let bodyData = extractRequestBody(operation) || parameterMap.value
        let body = null
        if (typeof bodyData !== 'boolean') {
          body = bodyData
        }
        const payload: FuseData = {
          title: operation.name,
          operationId: operation.operationId,
          description: operation.description,
          httpVerb: operation.httpVerb,
          path: operation.path,
          tag: tag.name,
        }

        if (body) {
          payload.body = body
        }

        fuseDataArray.push(payload)
      })
    }
  })

  fuse.setCollection(fuseDataArray)
})
</script>
<template>
  <FlowModal :state="modalState">
    <div>
      <input
        placeholder="Search …"
        class="ref-search-input"
        v-model="searchText"
        @input="fuseSearch"
        type="text" />
    </div>
    <div>
      <button
        v-for="entry in fuseSearchResults"
        :key="entry.refIndex"
        class="item-entry"
        @click="handleHyperLinkClick(entry.item.operation, entry.item.tag)">
        <div class="item-entry-title">
          {{ entry.item.title }}
        </div>
        <div class="item-entry-request">
          <div
            class="item-entry-http-verb"
            :class="`item-entry-http-verb--${entry.item.httpVerb}`">
            {{ entry.item.httpVerb }}
          </div>
          <div class="item-entry-path">
            {{ entry.item.path }}
          </div>
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
  font-size: 13px;
  outline: none;
  border: 1px solid var(--theme-border-color);
  border-radius: var(--theme-radius);
  color: var(--theme-color-1);
  font-weight: var(--theme-semibold);
  font-size: var(--theme-font-size-3);
  appearance: none;
  margin-bottom: 12px;
}
.ref-search-input::-webkit-input-placeholder,
.ref-search-input::placeholder {
  color: var(--theme-color-3);
  font-family: var(--theme-font);
  font-weight: var(--theme-regular);
}
/** Results */
.item-entry {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  padding: 6px 12px;
  width: 100%;
  font-size: var(--theme-font-size-3);
  text-align: left;
  border-radius: var(--theme-radius);
}
.item-entry:hover {
  background: var(--theme-background-2);
  box-shadow: 0 0 0 1px var(--theme-background-2);
}

.item-entry-title {
  font-weight: var(--theme-semibold);
}
.item-entry-request {
  display: flex;
  gap: 3px;
  margin-top: 3px;
  font-family: var(--theme-font-code);
}
.item-entry-http-verb {
  text-transform: uppercase;
}
.item-entry-http-verb--post {
  color: var(--theme-post-color);
}
.item-entry-http-verb--patch {
  color: var(--theme-patch-color);
}
.item-entry-http-verb--get {
  color: var(--theme-get-color);
}
.item-entry-http-verb--delete {
  color: var(--theme-delete-color);
}
.item-entry-http-verb--put {
  color: var(--theme-put-color);
}
.item-entry-path {
  color: var(--theme-color-3);
}
</style>
