<script setup lang="ts">
import { ScalarButton, ScalarHeaderButton } from '@scalar/components'
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
    <ScalarHeaderButton
      v-if="isActiveDocumentDirty"
      aria-label="Discard changes"
      data-testid="app-header-revert-button"
      title="Discard"
      @click="emit('revert')">
      <ScalarIconArrowCounterClockwise
        class="size-3.5"
        size="sm"
        thickness="1.5" />
    </ScalarHeaderButton>
    <ScalarButton
      aria-label="Save"
      class="gap-1.5"
      data-testid="app-header-save-button"
      :disabled="!isActiveDocumentDirty"
      size="sm"
      title="Save"
      variant="gradient"
      @click="emit('save')">
      <ScalarIconFloppyDisk
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <span class="max-md:hidden">Save</span>
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
    <ScalarHeaderButton
      v-if="isActiveDocumentDirty"
      aria-label="Discard changes"
      class="shrink-0 gap-1.5"
      data-testid="app-header-revert-button"
      title="Discard"
      @click="emit('revert')">
      <ScalarIconArrowCounterClockwise
        class="size-3.5"
        size="sm"
        thickness="1.5" />
      <span class="max-md:hidden">Discard</span>
    </ScalarHeaderButton>
    <ScalarHeaderButton
      :aria-label="isOffline ? 'Pull (offline)' : 'Pull'"
      class="shrink-0 gap-1.5 disabled:opacity-50"
      cta
      data-testid="app-header-pull-button"
      :disabled="!canPullActiveDocument"
      :title="isOffline ? 'You are offline.' : 'Pull'"
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
      <span class="max-md:hidden">Pull</span>
    </ScalarHeaderButton>
    <ScalarHeaderButton
      :aria-label="isOffline ? 'Push (offline)' : 'Push'"
      class="shrink-0 gap-1.5 disabled:opacity-50"
      cta
      data-testid="app-header-push-button"
      :disabled="!canPushActiveDocument"
      :title="isOffline ? 'You are offline.' : 'Push'"
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
      <span class="max-md:hidden">Push</span>
    </ScalarHeaderButton>
  </template>
  <!--
    Team workspace cluster for documents that have not been published
    yet. A single Publish button kicks off the first-time push to the
    registry; once that succeeds the document gets a registry meta and
    switches over to the Pull / Push cluster above on the next render.
  -->
  <ScalarHeaderButton
    v-if="showTeamPublishAction"
    :aria-label="isOffline ? 'Publish (offline)' : 'Publish'"
    class="shrink-0 gap-1.5 disabled:opacity-50"
    cta
    data-testid="app-header-publish-button"
    :disabled="isOffline"
    :title="isOffline ? 'You are offline.' : 'Publish'"
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
    <span class="max-md:hidden">Publish</span>
  </ScalarHeaderButton>
</template>
