<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarComboboxOption,
} from '@scalar/components'
import type {
  RequestMethod,
  RequestPayload,
} from '@scalar/oas-utils/entities/spec'
import { REGEX } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

type ExtendedRequestPayload = RequestPayload & {
  url?: string
}

const { metaData } = defineProps<{
  metaData: {
    parsedCurl: ExtendedRequestPayload
    collectionUid: string
  }
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const workspaceContext = useWorkspace()

const { activeWorkspaceCollections, activeCollection, activeWorkspace } =
  useActiveEntities()
const { requestMutators, serverMutators, servers } = workspaceContext

const selectedServerUid = ref('')
const router = useRouter()

const collections = computed(() =>
  activeWorkspaceCollections.value.map((collection) => ({
    id: collection.uid,
    label: collection.info?.title ?? 'Unititled Collection',
  })),
)

const selectedCollection = ref<ScalarComboboxOption | undefined>(
  metaData.collectionUid
    ? collections.value.find(
        (collection) => collection.id === metaData.collectionUid,
      )
    : collections.value.find(
        (collection) => collection.id === activeCollection.value?.uid,
      ),
)

function createRequestFromCurl({ collectionUid }: { collectionUid: string }) {
  if (!metaData.parsedCurl) {
    return
  }

  const collection = activeWorkspaceCollections.value.find(
    (c) => c.uid === collectionUid,
  )

  if (!collection) {
    return
  }

  const isDrafts = collection?.info?.title === 'Drafts'

  // Prevent adding servers to drafts
  if (!isDrafts && metaData.parsedCurl.servers) {
    // Find existing server to avoid duplication
    const existingServer = Object.values(servers).find(
      (s) => s.url === metaData.parsedCurl?.servers?.[0],
    )
    if (existingServer) {
      selectedServerUid.value = existingServer.uid
    } else {
      selectedServerUid.value = serverMutators.add(
        { url: metaData.parsedCurl.servers[0] ?? '/' },
        collection.uid,
      ).uid
    }
  }

  // Add the request and use the url if it's a draft as a path
  const newRequest = requestMutators.add(
    {
      summary: isDrafts
        ? metaData.parsedCurl?.url?.replace(REGEX.PROTOCOL, '')
        : metaData.parsedCurl?.path,
      path: isDrafts ? metaData.parsedCurl?.url : metaData.parsedCurl?.path,
      method: metaData.parsedCurl?.method,
      parameters: metaData.parsedCurl?.parameters,
      selectedServerUid: isDrafts ? undefined : selectedServerUid.value,
      requestBody: metaData.parsedCurl?.requestBody,
    },
    collection.uid,
  )

  if (newRequest && activeWorkspace.value?.uid) {
    router.push({
      name: 'request',
      params: {
        [PathId.Workspace]: activeWorkspace.value.uid,
        [PathId.Collection]: collection.uid,
        [PathId.Request]: newRequest.uid,
      },
    })
  }

  emits('close')
}

const handleImportClick = () => {
  createRequestFromCurl({
    collectionUid: selectedCollection.value?.id ?? '',
  })
}
</script>
<template>
  <div class="text-c-2 flex-center py-1.5 text-sm">Import cURL</div>
  <CommandActionForm
    class="mt-1.5 min-h-fit"
    @submit="handleImportClick">
    <div
      class="flex h-9 flex-row items-center gap-2 rounded border p-[3px] text-sm">
      <div class="flex h-full">
        <HttpMethod
          :isEditable="false"
          isSquare
          :method="(metaData.parsedCurl?.method as RequestMethod) || 'get'" />
      </div>
      <span class="scroll-timeline-x whitespace-nowrap">
        {{ metaData.parsedCurl?.servers?.[0] || ''
        }}{{ metaData.parsedCurl?.path || '' }}
      </span>
    </div>

    <template #options>
      <div class="flex">
        <ScalarListbox
          v-model="selectedCollection"
          :options="collections">
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <span
              class="whitespace-nowrap"
              :class="selectedCollection ? 'text-c-1' : 'text-c-3'">
              {{
                selectedCollection
                  ? selectedCollection.label
                  : 'Select Collection'
              }}
            </span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
      </div>
    </template>

    <template #submit>
      <span @click="handleImportClick">Import Request</span>
    </template>
  </CommandActionForm>
</template>
<style scoped>
.scroll-timeline-x {
  overflow: auto;
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none;
}
</style>
