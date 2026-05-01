<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import {
  ScalarIconArrowCounterClockwise,
  ScalarIconCloudArrowDown,
  ScalarIconCloudArrowUp,
  ScalarIconCloudSlash,
  ScalarIconFloppyDisk,
} from '@scalar/icons'

defineProps<{
  /** Whether the local-workspace Save / Revert cluster should mount. */
  showLocalSaveActions: boolean
  /** Whether the team-workspace Pull / Push cluster should mount. */
  showTeamSyncActions: boolean
  /** Whether the team-workspace Publish cluster should mount. */
  showTeamPublishAction: boolean
  /** Whether the active document has unsaved local edits. */
  isActiveDocumentDirty: boolean
  /** Whether the browser currently reports as offline. */
  isOffline: boolean
  /** Whether the Pull button is clickable. */
  canPullActiveDocument: boolean
  /** Whether the Push button is clickable. */
  canPushActiveDocument: boolean
}>()

const emit = defineEmits<{
  save: []
  revert: []
  pull: []
  push: []
  publish: []
}>()
</script>

<template>
  <!--
    Local workspace cluster: Save is always mounted while a document is
    active so the affordance does not jump around, and gets disabled
    when the document is clean. Revert only joins it once there is
    something to revert.
  -->
  <template v-if="showLocalSaveActions">
    <ScalarButton
      v-if="isActiveDocumentDirty"
      aria-label="Revert changes"
      class="text-c-2 hover:text-c-1 size-6 shrink-0 p-0"
      data-testid="app-header-revert-button"
      size="xs"
      type="button"
      variant="ghost"
      @click="emit('revert')">
      <ScalarIconArrowCounterClockwise
        class="size-3.5"
        size="sm"
        thickness="1.5" />
    </ScalarButton>
    <ScalarButton
      class="shrink-0 gap-1.5"
      data-testid="app-header-save-button"
      :disabled="!isActiveDocumentDirty"
      size="xs"
      type="button"
      variant="solid"
      @click="emit('save')">
      <ScalarIconFloppyDisk
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <span>Save</span>
    </ScalarButton>
  </template>
  <!--
    Team workspace cluster for registry-backed documents. The same Revert
    affordance as local workspaces sits in front of the Pull / Push pair
    so dirty edits can be discarded without going through the registry.
    Pull / Push enablement tracks the cached `VersionStatus` so only one
    of them is actionable at a time.
  -->
  <template v-if="showTeamSyncActions">
    <ScalarButton
      v-if="isActiveDocumentDirty"
      aria-label="Revert changes"
      class="text-c-2 hover:text-c-1 size-6 shrink-0 p-0"
      data-testid="app-header-revert-button"
      size="xs"
      type="button"
      variant="ghost"
      @click="emit('revert')">
      <ScalarIconArrowCounterClockwise
        class="size-3.5"
        size="sm"
        thickness="1.5" />
    </ScalarButton>
    <ScalarButton
      :aria-label="isOffline ? 'Pull (offline)' : undefined"
      class="shrink-0 gap-1.5"
      data-testid="app-header-pull-button"
      :disabled="!canPullActiveDocument"
      size="xs"
      :title="isOffline ? 'You are offline.' : undefined"
      type="button"
      variant="solid"
      @click="emit('pull')">
      <ScalarIconCloudSlash
        v-if="isOffline"
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <ScalarIconCloudArrowDown
        v-else
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <span>Pull</span>
    </ScalarButton>
    <ScalarButton
      :aria-label="isOffline ? 'Push (offline)' : undefined"
      class="shrink-0 gap-1.5"
      data-testid="app-header-push-button"
      :disabled="!canPushActiveDocument"
      size="xs"
      :title="isOffline ? 'You are offline.' : undefined"
      type="button"
      variant="solid"
      @click="emit('push')">
      <ScalarIconCloudSlash
        v-if="isOffline"
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <ScalarIconCloudArrowUp
        v-else
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <span>Push</span>
    </ScalarButton>
  </template>
  <!--
    Team workspace cluster for documents that have not been published
    yet. A single Publish button kicks off the first-time push to the
    registry; once that succeeds the document gets a registry meta and
    switches over to the Pull / Push cluster above on the next render.
  -->
  <ScalarButton
    v-if="showTeamPublishAction"
    :aria-label="isOffline ? 'Publish (offline)' : undefined"
    class="shrink-0 gap-1.5"
    data-testid="app-header-publish-button"
    :disabled="isOffline"
    size="xs"
    :title="isOffline ? 'You are offline.' : undefined"
    type="button"
    variant="solid"
    @click="emit('publish')">
    <ScalarIconCloudSlash
      v-if="isOffline"
      class="size-3.5"
      size="sm"
      thickness="1.5" />
    <ScalarIconCloudArrowUp
      v-else
      class="size-3.5"
      size="sm"
      thickness="1.5" />
    <span>Publish</span>
  </ScalarButton>
</template>
