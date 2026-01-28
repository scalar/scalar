<script setup lang="ts">
import {
  ScalarColorModeToggle,
  ScalarModal,
  ScalarTextInput,
  type ModalState,
} from '@scalar/components'
import { ScalarIconCaretDown, ScalarIconCaretRight } from '@scalar/icons'

import { useState } from '@/state/state'
import DocSettings from '@/views/Settings/DocSettings.vue'

const { modalState } = defineProps<{
  modalState: ModalState
}>()

const { workspaceStore, proxyUrl } = useState()

function selectDocument(name: string) {
  workspaceStore.update('x-scalar-active-document', name)
}
</script>

<template>
  <ScalarModal
    class="settingsModal"
    :state="modalState">
    <div class="settingsHeading">
      <h1>Settings</h1>
      <ScalarColorModeToggle class="colorToggle ml-auto" />
    </div>
    <div class="documentList">
      <template
        v-if="Object.entries(workspaceStore.workspace.documents).length">
        <div
          v-for="[name, document] of Object.entries(
            workspaceStore.workspace.documents,
          )"
          :key="name"
          class="document">
          <button
            class="documentName"
            :class="{
              documentNameActive:
                workspaceStore.workspace.activeDocument === document,
            }"
            type="button"
            @click="selectDocument(name)">
            @{{ name }}
            <ScalarIconCaretDown
              v-if="workspaceStore.workspace.activeDocument === document" />
            <ScalarIconCaretRight v-else />
          </button>
          <div v-if="workspaceStore.workspace.activeDocument === document">
            <DocSettings
              :document
              :name />
          </div>
        </div>
      </template>
      <div
        v-else
        class="noDocuments">
        No APIs selected. Use + to add context.
      </div>
    </div>

    <div class="proxyUrlContainer">
      <label for="proxyUrl">Proxy URL</label>
      <ScalarTextInput
        id="proxyUrl"
        v-model="proxyUrl"
        placeholder="https://proxy.scalar.com" />
    </div>
  </ScalarModal>
</template>

<style>
/* Prevent auth method dropdown from going behind the modal */
.settingsModal .scalar-modal-layout {
  z-index: 10 !important;
}

.settingsModal .scalar-modal-body {
  overflow-y: scroll;
  overflow-x: hidden;
}
</style>

<style scoped>
.documentList {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-font-size-3);
  margin-bottom: 12px;
}

.document {
  display: flex;
  flex-direction: column;
  width: calc(100% + 24px);
  left: -12px;
  position: relative;
  padding: 0 12px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.document:first-of-type:not(:last-of-type) {
  border-bottom: none;
}

.documentName {
  gap: 4px;
  display: flex;
  align-items: center;
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-2);
  padding: 12px 0;
}

.documentNameActive {
  color: var(--scalar-color-1);
}

.settingsHeading {
  font-size: 19px;
  margin-bottom: 12px;
  display: flex;
  gap: 5px;
  align-items: center;
  font-weight: var(--scalar-semibold);
}

.proxyUrlContainer {
  font-size: var(--scalar-font-size-3);
  display: flex;
  gap: 5px;
  flex-direction: column;
}
.proxyUrlContainer label {
  font-weight: var(--scalar-semibold);
}
.noDocuments {
  color: var(--scalar-color-2);
  margin-bottom: 10px;
}
</style>
