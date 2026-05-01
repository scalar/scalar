<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { ref } from 'vue'

import { type ModalState, ScalarButton, ScalarModal } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { type WorkspaceStore } from '@scalar/workspace-store/client'

import { queryClient } from '@/helpers/query-client'
import { scalarClient } from '@/helpers/scalar-client'
import { suggestNextVersion } from '@/helpers/suggest-next-version'

const {
  state,
  registryMeta,
  documentTitle,
  currentVersion,
  documentContent,
  documentName,
  workspaceStore,
} = defineProps<{
  /** Modal visibility state */
  state: ModalState
  /** Registry meta (namespace, slug) from x-scalar-registry-meta */
  registryMeta: { namespace: string; slug: string }
  /** Document title for display */
  documentTitle: string
  /** Current version from the document's info.version (after rebase) */
  currentVersion: string
  /** Serialized document content (JSON string) to publish */
  documentContent: string
  /** Document name */
  documentName: string
  /** Workspace store */
  workspaceStore: WorkspaceStore
}>()

const emit = defineEmits<{
  /** Emitted when the modal is closed */
  (e: 'close'): void
}>()

const { toast } = useToasts()

/** Version to publish when syncing to registry (suggested next or current) */
const versionToPublish = ref(suggestNextVersion(currentVersion || '1.0.0'))

const { mutateAsync, isPending: isSyncing } = useMutation(
  {
    mutationFn: (vars: {
      namespace: string
      slug: string
      version: string
      document: string
    }) =>
      scalarClient.registry.postv1ApisNamespaceSlugVersion({
        namespace: vars.namespace,
        slug: vars.slug,
        requestBody: { version: vars.version, document: vars.document },
      }),
    onSuccess: () => {
      // Run promotion while component is still mounted (before close triggers unmount)
      workspaceStore.promoteIntermediateToOriginal(documentName)
      state.hide()
      emit('close')
      toast('Document synced to registry', 'info')
    },
    onError: (error) => {
      console.error(error)
      toast('Failed to sync document to registry', 'error')
    },
  },
  queryClient,
)

function handleKeepLocalOnly() {
  state.hide()
  emit('close')
}

async function handleSyncToRegistry() {
  if (!documentContent || !registryMeta) return

  await mutateAsync({
    namespace: registryMeta.namespace,
    slug: registryMeta.slug,
    version: versionToPublish.value,
    document: documentContent,
  })
}

/** Reset form when modal opens (e.g. re-suggest version) */
function syncVersionFromProps() {
  versionToPublish.value = suggestNextVersion(currentVersion || '1.0.0')
}
</script>

<template>
  <ScalarModal
    size="md"
    :state="state"
    @close="emit('close')"
    @open="syncVersionFromProps">
    <div class="flex flex-col gap-4 p-1">
      <div class="text-c-1 text-lg font-medium">
        Document updated from source
      </div>
      <p class="text-c-2 text-sm">
        The document
        <em class="font-semibold">{{ documentTitle }}</em>
        was rebased. You can keep the changes locally only or sync them to the
        Scalar registry.
      </p>

      <div class="flex flex-col gap-2">
        <label class="text-c-2 text-xs font-medium">Version to publish</label>
        <input
          v-model="versionToPublish"
          class="bg-b-2 border-border text-c-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--scalar-color-accent)]"
          placeholder="e.g. 1.0.1"
          type="text" />
      </div>

      <div class="flex flex-wrap gap-2 pt-2">
        <ScalarButton
          :disabled="isSyncing"
          size="md"
          variant="outlined"
          @click="handleKeepLocalOnly">
          Keep local only
        </ScalarButton>
        <ScalarButton
          :disabled="isSyncing"
          :loading="isSyncing"
          size="md"
          variant="solid"
          @click="handleSyncToRegistry">
          Sync to registry
        </ScalarButton>
      </div>
    </div>
  </ScalarModal>
</template>
