<script lang="ts" setup>
/**
 * The localhost shell's side panel: the developer tool picked in the toolbar, shown beside the card
 * instead of in a dropdown. ApiReference loads it on demand, so a hosted reference never fetches it.
 */
import type {
  ApiReferenceConfiguration,
  ApiReferenceTranslationKey,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import {
  computed,
  nextTick,
  onMounted,
  reactive,
  useTemplateRef,
  watch,
} from 'vue'

import ExploreScalarModal from '@/features/explore-scalar/components/ExploreScalarModal.vue'
import { useLocalization } from '@/features/localization'

import DeployWaitlist from './components/DeployWaitlist.vue'
import ModifyConfigurationForm from './components/ModifyConfigurationForm.vue'
import ShareApiReferenceCard from './components/ShareApiReferenceCard.vue'
import type { ShellPanel } from './use-shell-panel'

const { panel, focusRequest } = defineProps<{
  id: string
  panel: ShellPanel
  /** Moves focus into the panel when it changes (see `useShellPanel`) */
  focusRequest?: number
  configuration?: Partial<ApiReferenceConfiguration>
  externalUrls: ExternalUrls
  /** Only set once a document has loaded; sharing, deploying and SDKs need one */
  workspace?: WorkspaceStore
  /** The document URL, which the Generate SDK sign-up links to directly when it is public */
  url?: string
  /**
   * Identifies the active document. Its tools start over when it changes, so an upload made for one
   * document is never shared or deployed for the next.
   */
  documentKey?: string
  /** The framework serving the reference, which Deploy offers to run on Scalar */
  integration?: ApiReferenceConfiguration['_integration']
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')
const { translate } = useLocalization()

/** Each panel is named after the toolbar button that opens it */
const LABELS = {
  configure: 'developerTools.configure',
  share: 'developerTools.share',
  deploy: 'developerTools.deploy',
  sdk: 'sdk.generate',
} as const satisfies Record<ShellPanel, ApiReferenceTranslationKey>

const label = computed<string>(() => translate(LABELS[panel]))

/** The Explore Scalar content closes through its modal state, which here closes the panel */
const sdkState = reactive({
  open: true,
  show: (): void => undefined,
  hide: (): void => emit('close'),
})

const root = useTemplateRef<HTMLElement>('root')

/** The panel is sticky, so focusing it must not scroll the page */
const focusPanel = (): void => root.value?.focus({ preventScroll: true })

/** Escape closes the panel, unless a control inside it (an open listbox, say) already used it */
const onEscape = (event: KeyboardEvent): void => {
  if (event.defaultPrevented) {
    return
  }
  event.preventDefault()
  emit('close')
}

watch(
  () => focusRequest,
  (request) => {
    if (request !== undefined) {
      void nextTick(focusPanel)
    }
  },
)

onMounted(() => {
  if (focusRequest !== undefined) {
    focusPanel()
  }
})
</script>
<template>
  <aside
    :id
    ref="root"
    :aria-label="label"
    class="developer-tools-panel flex flex-col rounded-lg focus-visible:outline-offset-2"
    tabindex="-1"
    @keydown.escape="onEscape">
    <!-- Generate SDK: the Explore Scalar dialog's content as a card of its own, with its own close button.
         Every card runs to the bottom of the viewport like the reference beside it, and scrolling
         inside one never carries on into the page. -->
    <ExploreScalarModal
      v-if="panel === 'sdk' && workspace"
      :key="documentKey"
      class="bg-b-1 custom-scroll custom-scroll-self-contain-overflow min-h-0 flex-1 overflow-y-auto rounded-lg border"
      :externalUrls
      :morphStickers="false"
      presentation="panel"
      :state="sdkState"
      :url
      :usesViewTransition="false"
      :workspace />
    <!-- Share and Deploy: cards in the same frame as the Generate SDK content -->
    <ShareApiReferenceCard
      v-else-if="panel === 'share' && workspace"
      :key="documentKey"
      class="custom-scroll custom-scroll-self-contain-overflow min-h-0 flex-1 overflow-y-auto rounded-lg border"
      :externalUrls
      :workspace
      @close="emit('close')" />
    <DeployWaitlist
      v-else-if="panel === 'deploy'"
      class="custom-scroll custom-scroll-self-contain-overflow min-h-0 flex-1 overflow-y-auto rounded-lg border"
      :integration
      @close="emit('close')" />
    <!-- Configure: just the settings; Escape or the toolbar button closes it -->
    <div
      v-else-if="panel === 'configure'"
      :key="documentKey"
      class="bg-b-1 custom-scroll custom-scroll-self-contain-overflow flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto rounded-lg border p-5">
      <ModifyConfigurationForm
        v-model:overrides="overrides"
        :configuration
        flat />
    </div>
  </aside>
</template>
