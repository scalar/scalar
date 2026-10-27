<script lang="ts" setup>
import { ScalarButton } from '@scalar/components/button'
import { ScalarIcon } from '@scalar/components/icon'
import {
  ScalarIconShareNetwork,
  ScalarIconSlidersHorizontal,
} from '@scalar/icons'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type {
  ApiReferenceConfiguration,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { GenerateSdkButton } from '@/features/generate-sdk'
import { useLocalization } from '@/features/localization'

import ApiReferenceToolbarTitle from './components/ApiReferenceToolbarTitle.vue'
import DeployApiReference from './components/DeployApiReference.vue'
import DeveloperToolsHovercard from './components/DeveloperToolsHovercard.vue'
import ModifyConfiguration from './components/ModifyConfiguration.vue'
import ShareApiReference from './components/ShareApiReference.vue'
import { getServerFramework } from './server-frameworks'
import type { ShellPanel } from './use-shell-panel'

const {
  configuration,
  externalUrls,
  variant = 'content',
  activePanel,
  panelId,
} = defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
  externalUrls: ExternalUrls
  /**
   * Where the toolbar renders. `content` is the bar at the top of the content column, whose items
   * open dropdowns. `shell` is the localhost-only bar above the whole reference, which the parent
   * positions and colors; its items open the side panel beside the card instead.
   */
  variant?: 'content' | 'shell'
  /** The open side panel, for the shell bar's toggle states */
  activePanel?: ShellPanel
  /** The side panel's id, for `aria-controls` on the shell bar's toggles */
  panelId?: string
}>()

const emit = defineEmits<{
  /** The shell bar asks for a side panel to open or close */
  (event: 'togglePanel', panel: ShellPanel): void
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')
const { translate } = useLocalization()

/** The content variant keeps its classes verbatim, so a hosted toolbar renders exactly as before */
const toolbarClasses = computed<string>(() =>
  variant === 'shell'
    ? 'api-reference-toolbar flex h-(--refs-shell-toolbar-height)'
    : 'api-reference-toolbar bg-b-1 relative z-1 flex h-10 justify-center border-b px-15',
)

/**
 * The shell bar spans the card below it, so its contents are not capped to the content width, and
 * its first and last buttons line up with the card's left and right borders. Buttons sit 4px apart.
 */
const toolbarInnerClasses = computed<string>(() =>
  variant === 'shell'
    ? 'flex flex-1 items-center gap-1'
    : '-mx-2 flex max-w-(--refs-content-max-width) flex-1 items-center',
)

/**
 * Same look as the dropdown triggers, with a 16px icon 8px from the label and Deploy's corner radius,
 * plus a pressed state while their panel is open
 */
const SHELL_TOGGLE_CLASSES =
  'text-c-2 hover:text-c-1 hover:bg-b-3 aria-expanded:text-c-1 aria-expanded:bg-b-3 flex h-8 items-center gap-2 rounded-lg px-2 text-sm leading-none'

/**
 * Escape anywhere in the shell bar closes the open panel, the way it does from inside the panel.
 * Controls that use Escape themselves (the Developer Tools card) mark it handled first. Only the
 * shell bar listens at all, so the content bar of a hosted reference carries no listener.
 */
const closePanelOnEscape = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape' || !activePanel || event.defaultPrevented) {
    return
  }
  event.preventDefault()
  emit('togglePanel', activePanel)
}
const onKeydown = variant === 'shell' ? closePanelOnEscape : undefined

/** The shell's Deploy names the framework serving the reference, or the API in general */
const deployLabel = computed<string>(() => {
  const framework = getServerFramework(configuration?._integration)
  return framework
    ? translate('developerTools.deployFrameworkButton', {
        framework: framework.name,
      })
    : translate('developerTools.deployApiButton')
})

/** Disclosure state for a shell toggle; the panel only exists while it is open */
const toggleAttributes = (
  panel: ShellPanel,
): { 'aria-expanded': boolean; 'aria-controls': string | undefined } => ({
  'aria-expanded': activePanel === panel,
  'aria-controls': activePanel === panel ? panelId : undefined,
})

const showDeveloperTools = computed<boolean>(() => {
  if (configuration?.showDeveloperTools === 'always') {
    return true
  }

  if (configuration?.showDeveloperTools === 'never') {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  return isLocalUrl(window.location.href)
})
</script>
<template>
  <header
    v-if="showDeveloperTools"
    :aria-label="translate('developerTools.title')"
    :class="toolbarClasses"
    :data-scalar-scroll-header="variant === 'shell' || undefined"
    :onKeydown="onKeydown"
    :role="variant === 'shell' ? 'region' : undefined">
    <!-- The header stays the only root node on purpose: a comment beside it would turn the root
         into a fragment, and the parent's `class` would no longer fall through to it. -->
    <!-- The shell bar is sticky, so scroll targeting measures it like any other pinned header -->
    <!-- Outside <main> a <header> is the page's banner landmark; the shell bar is a named region instead -->
    <!-- Each item is a v-if/v-else pair of single elements, so the content bar renders the same
         nodes as before this variant existed -->
    <div :class="toolbarInnerClasses">
      <div
        v-if="variant === 'content'"
        class="flex flex-1 items-center">
        <ApiReferenceToolbarTitle />
      </div>
      <!-- The Scalar mark on the card's left border, a divider, then what the bar is -->
      <div
        v-else
        class="me-auto flex items-center">
        <a
          class="text-c-1 flex size-6 shrink-0 items-center justify-center rounded"
          href="https://scalar.com"
          rel="noopener noreferrer"
          target="_blank">
          <ScalarIcon
            aria-hidden="true"
            class="size-6"
            icon="Logo" />
          <span class="sr-only">
            Scalar, {{ translate('exploreScalar.opensInNewTab') }}
          </span>
        </a>
        <span
          aria-hidden="true"
          class="ms-3 me-1 h-4 w-px bg-(--scalar-border-color)" />
        <DeveloperToolsHovercard />
      </div>
      <ModifyConfiguration
        v-if="variant === 'content'"
        v-model:overrides="overrides"
        :configuration />
      <button
        v-else
        v-bind="toggleAttributes('configure')"
        :class="SHELL_TOGGLE_CLASSES"
        type="button"
        @click="emit('togglePanel', 'configure')">
        <ScalarIconSlidersHorizontal class="size-4" />
        {{ translate('developerTools.configure') }}
      </button>
      <template v-if="workspace">
        <ShareApiReference
          v-if="variant === 'content'"
          :externalUrls
          :workspace />
        <button
          v-else
          v-bind="toggleAttributes('share')"
          :class="SHELL_TOGGLE_CLASSES"
          type="button"
          @click="emit('togglePanel', 'share')">
          <ScalarIconShareNetwork class="size-4" />
          {{ translate('developerTools.share') }}
        </button>
        <!-- The content bar keeps Deploy before Generate SDK; the shell bar ends on Deploy as its
             primary action. Two v-if/v-else pairs swap them without adding a node to either bar. -->
        <DeployApiReference
          v-if="variant === 'content'"
          :externalUrls
          :workspace />
        <!-- In the shell this discloses the side panel too (see the Generate SDK context) -->
        <GenerateSdkButton v-else />
        <GenerateSdkButton v-if="variant === 'content'" />
        <ScalarButton
          v-else
          v-bind="toggleAttributes('deploy')"
          class="max-h-8 rounded-lg px-3"
          size="sm"
          @click="emit('togglePanel', 'deploy')">
          {{ deployLabel }}
        </ScalarButton>
      </template>
    </div>
  </header>
</template>
