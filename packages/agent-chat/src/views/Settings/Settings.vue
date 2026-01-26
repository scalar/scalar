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
  <ScalarModal :state="modalState">
    <div class="settingsHeading">
      <h1>Settings</h1>
      <ScalarColorModeToggle class="colorToggle ml-auto" />
    </div>
    <div class="documentList">
      <label> APIs </label>

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
            <ScalarIconCaretDown
              v-if="workspaceStore.workspace.activeDocument === document" />
            <ScalarIconCaretRight v-else />
            @{{ name }}
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
.scalar-modal-layout {
  z-index: 1000 !important;
}
</style>

<style scoped>
.documentList {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 10px;
  font-size: var(--scalar-font-size-3);
}

.document {
  display: flex;
  flex-direction: column;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-xl);
}

.documentName {
  background: var(--scalar-background-2);
  padding: 5px 10px;
  border-radius: var(--scalar-radius);
  color: var(--scalar-color-3);
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--scalar-font-size-3);
}

.documentNameActive {
  color: var(--scalar-color-1);
}

.settingsHeading {
  font-size: 19px;
  margin-bottom: 15px;
  display: flex;
  gap: 5px;
  align-items: center;
}

.proxyUrlContainer {
  font-size: var(--scalar-font-size-3);
  display: flex;
  gap: 5px;
  flex-direction: column;
}

.noDocuments {
  color: var(--scalar-color-2);
  margin-bottom: 10px;
}
</style>
