<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import {
  type ModalState,
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import { useMagicKeys, whenever } from '@vueuse/core'
import type { FuseResult } from 'fuse.js'
import Fuse from 'fuse.js'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  modalState: ModalState
}>()

const router = useRouter()

const { requests } = useWorkspace()

const keys = useMagicKeys()

type FuseData = {
  title: string
  description: string
  httpVerb: string
  id: string
  path: string
}

const fuseDataArray = ref<FuseData[]>([])
const searchResults = ref<FuseResult<FuseData>[]>([])
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

watch(
  () => props.modalState.open,
  (open) => {
    if (!open) return
    searchText.value = ''
    selectedSearchResult.value = 0
    searchResults.value = []
  },
)

onMounted(() => {
  searchModalRef.value?.focus()
  Object.keys(requests).forEach((request) => {
    const req = requests[request]

    fuseDataArray.value.push({
      id: request,
      title: req.summary ?? req.method,
      description: req.description ?? '',
      httpVerb: req.method,
      path: req.path,
    })
  })

  fuse.setCollection(fuseDataArray.value)
})

function onSearchResultClick(entry: FuseResult<FuseData>) {
  router.push(entry.item.id)
  props.modalState.hide()
}

const selectedEntry = computed<FuseResult<FuseData>>(
  () => searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
)

const searchResultsWithPlaceholderResults = computed(
  (): FuseResult<FuseData>[] => {
    if (searchText.value.length === 0) {
      return fuseDataArray.value.map((item) => {
        return {
          item: item,
        } as FuseResult<FuseData>
      })
    }

    return searchResults.value
  },
)

whenever(keys.enter, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  onSearchResultClick(selectedEntry.value)
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

  document
    .getElementById(`search-modal-${selectedEntry.value.item.id}`)
    ?.scrollIntoView({
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

  document
    .getElementById(`search-modal-${selectedEntry.value.item.id}`)
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
})
</script>
<template>
  <ScalarModal
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
        :id="`#search-modal-${entry.item.id}`"
        :key="entry.refIndex"
        :active="selectedSearchResult === index"
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
      </ScalarSearchResultItem>
      <template #query>{{ searchText }}</template>
    </ScalarSearchResultList>
    <div class="ref-search-meta">
      <span>↑↓ Navigate</span>
      <span>⏎ Select</span>
    </div>
  </ScalarModal>
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
