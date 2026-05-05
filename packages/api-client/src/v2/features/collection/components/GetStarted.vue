<script lang="ts">
/**
 * Workspace get started page.
 *
 * Shown as the landing view for a workspace with no request selected.
 *
 * On a local workspace it displays an ASCII art mark and a short list of
 * keyboard shortcuts to help the user bootstrap their workspace (open the
 * command palette, jump to settings, or focus the sidebar filter).
 *
 * On an empty team workspace it instead surfaces a focused "Create a
 * Document" call-to-action: team workspaces are intended to back a real
 * OpenAPI document and the registry, so the keyboard-shortcut helper would
 * be a confusing first impression. The CTA reuses the command palette by
 * opening its `create-openapi-document` action so the actual creation flow
 * remains a single source of truth.
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarButton, ScalarHotkey } from '@scalar/components'
import {
  ScalarIconBracketsCurly,
  ScalarIconDownloadSimple,
} from '@scalar/icons'
import { computed } from 'vue'

import Computer from '@/assets/computer.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

const { eventBus, isTeamWorkspace, layout, workspaceStore } =
  defineProps<RouteProps>()

const openCommandPalette = () => {
  eventBus.emit('ui:open:command-palette')
}

/**
 * Open the contextual settings page. Emits the same event as the Cmd/Ctrl+I
 * hotkey so the workspace sidebar handles it uniformly: workspace-level
 * settings from this "Get started" screen, document-level settings when the
 * user is viewing a specific document. No `KeyboardEvent` is attached here
 * because the trigger is a click.
 */
const openSettings = () => {
  eventBus.emit('ui:open:settings')
}

/**
 * Open the contextual search affordance. Emits the same event as the Cmd/Ctrl+J
 * hotkey so the workspace sidebar handles it uniformly: the document filter
 * toggles on the workspace page and the search modal opens inside a document.
 * No `KeyboardEvent` is attached here because the trigger is a click.
 */
const focusSearch = () => {
  eventBus.emit('ui:focus:search')
}

/**
 * Open the command palette directly on the "Create OpenAPI Document" form.
 * The empty team workspace CTA delegates to this action so the create flow
 * stays in one place.
 */
const openCreateDocument = () => {
  eventBus.emit('ui:open:command-palette', {
    action: 'create-openapi-document',
    payload: undefined,
  })
}

/**
 * Whether the active workspace is a team workspace that has no real
 * documents yet. The auto-created `drafts` scratch document does not count
 * as content, so a workspace whose only entry is `drafts` is still treated
 * as empty.
 */
const isEmptyTeamWorkspace = computed(() => {
  if (!isTeamWorkspace) {
    return false
  }

  const documentNames = Object.keys(workspaceStore?.workspace?.documents ?? {})
  return documentNames.every((name) => name === 'drafts')
})
</script>

<template>
  <div class="flex h-full w-full flex-col items-center justify-center p-6">
    <!--
      Empty team workspace: surface a focused CTA pointing the user at the
      command palette's create-document flow rather than the local-workspace
      keyboard cheatsheet.
    -->
    <div
      v-if="isEmptyTeamWorkspace && isTeamWorkspace"
      class="flex max-w-sm flex-col gap-4">
      <ScalarIconBracketsCurly
        class="text-c-accent size-10"
        weight="bold" />
      <h2 class="text-c-1 text-base font-semibold">Create a Document</h2>
      <p class="text-c-2 text-sm leading-relaxed">
        The OpenAPI standard provides a descriptor of your API. Bringing it to
        our Registry allows you to manage, lint &amp; version your OpenAPI
        Documents. Create Docs &amp; SDKs from your OpenAPI Document.
      </p>
      <div>
        <ScalarButton
          class="mt-2"
          @click="openCreateDocument">
          Create Document
        </ScalarButton>
      </div>
    </div>

    <!-- Local workspace fallback: ASCII art mark and keyboard shortcuts. -->
    <div
      v-else
      class="flex flex-col items-stretch gap-10">
      <ScalarAsciiArt
        :art="Computer"
        class="text-c-3 self-center" />

      <div class="text-c-2 flex flex-col gap-3 text-sm">
        <button
          class="hover:text-c-1 flex w-full items-center justify-between gap-8"
          type="button"
          @click="openCommandPalette">
          <span>Get Started</span>
          <ScalarHotkey
            hotkey="K"
            :modifier="['default']" />
        </button>
        <button
          class="hover:text-c-1 flex w-full items-center justify-between gap-8"
          type="button"
          @click="openSettings">
          <span>Settings</span>
          <ScalarHotkey
            hotkey="I"
            :modifier="['default']" />
        </button>
        <button
          class="hover:text-c-1 flex w-full items-center justify-between gap-8"
          type="button"
          @click="focusSearch">
          <span>Filter</span>
          <ScalarHotkey
            hotkey="J"
            :modifier="['default']" />
        </button>
        <!--
          Browser-only nudge to install the desktop app. Hidden in the desktop
          and modal layouts because the user is already running the native app
          (or embedded in a host page).
        -->
        <a
          v-if="layout === 'web'"
          class="text-c-2 hover:text-c-1 flex w-full items-center justify-between gap-8"
          href="https://scalar.com/download?utm_source=web_client&utm_medium=download_button&utm_campaign=topnav"
          target="_blank">
          <span>Download App</span>
          <ScalarIconDownloadSimple
            class="size-3.5"
            weight="bold" />
        </a>
      </div>
    </div>
  </div>
</template>
