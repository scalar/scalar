<script setup lang="ts">
import { FlowModal, useModal } from '@scalar/use-modal'
import { useFileDialog } from '@vueuse/core'
import { ref, watch } from 'vue'

import spec from '../../petstorev3.json'
import FlowButton from '../FlowButton.vue'
import FlowTextField from '../FlowTextField.vue'

const emit = defineEmits<{
  (e: 'import', value: string): void
}>()

const { files, open, reset } = useFileDialog({
  multiple: false,
  accept: '.json,.yaml,.yml',
})

const swaggerURLModalState = useModal()
const swaggerUrl = ref('')

async function fetchURL() {
  const response = await fetch(swaggerUrl.value)
  const data = await response.json()
  emit('import', JSON.stringify(data, null, 4))
  swaggerURLModalState.hide()
}

watch(files, () => {
  if (files.value?.length) {
    const file = files.value[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (typeof data !== 'string') return

      emit('import', data)
      reset()
    }
    reader.readAsText(file)
  }
})

const useExample = () => {
  emit('import', JSON.stringify(spec, null, 2))
}

const showIntegrations = ref(true)
</script>
<template>
  <div class="swagger-editor-header">
    <div
      v-if="showIntegrations"
      class="swagger-editor-integrations">
      <b @click="showIntegrations = !showIntegrations">Integrations</b>
      <div class="swagger-editor-integrations-description">
        We integrate with tons of frameworks so you can self-host the scalar
        docs.
      </div>
      <div
        class="swagger-editor-integrations-toggle"
        @click="showIntegrations = false">
        <svg
          height="14"
          viewBox="0 0 14 14"
          width="14"
          xmlns="http://www.w3.org/2000/svg">
          <polygon
            fill="currentColor"
            fill-rule="nonzero"
            points="1.4 14 0 12.6 5.6 7 0 1.4 1.4 0 7 5.6 12.6 0 14 1.4 8.4 7 14 12.6 12.6 14 7 8.4" />
        </svg>
      </div>
      <div class="swagger-editor-integrations-list">
        <a
          class="swagger-editor-integrations-item"
          href="https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference#readme"
          target="_blank">
          <svg
            height="16"
            viewBox="0 0 19 16"
            width="19"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="m18.2 3.1.8-2V.9l-4.7 1.3C15.2 1 15 0 15 0s-2.5 1.6-4.3 1.5c-2 0-3.6.8-4 1-1.8 1.2-2.5 3.3-3.2 3.8L0 8.9 2.3 8l-2 2.5c.2.3 1.2 1.6 2.1 1.3l.4-.1 1.6.5-.7-1 .2-.2.9.3-.1-.8.9.3-.1-.8.3-.1 1-3.5 3.7-2.6-.3.7A4 4 0 0 1 8 7l-.6.2c-.5.5-.7.7-.8 2.5a2 2 0 0 1 1 0c1.6.4 2.2 2.3 1.7 2.9l-.7.6H8v.6h-.7v.5l-.2.2c-.7 0-1.4-.6-1.4-.6 0 .5.4 1.3.4 1.3s1.7 1.1 2.7.7c1-.4.7-2.3 2.8-3.2l3.3-.9.8-2.2-1.7.5v-2l2.5-.6.9-2.2-3.4.9v-2l4.2-1.1Z"
              fill="currentColor"
              fill-rule="nonzero" />
          </svg>
          <span>Fastify</span>
        </a>
        <a
          class="swagger-editor-integrations-item"
          href="https://github.com/scalar/scalar/tree/main#from-a-cdn"
          target="_blank">
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <g>
              <path
                d="M22.5 1.5h-21A1.5 1.5 0 0 0 0 3v3a1.5 1.5 0 0 0 1.5 1.5h21A1.5 1.5 0 0 0 24 6V3a1.5 1.5 0 0 0-1.5-1.5Zm-19.25 3A1.25 1.25 0 1 1 4.5 5.75 1.25 1.25 0 0 1 3.25 4.5ZM8.5 5.75A1.25 1.25 0 1 1 9.75 4.5 1.25 1.25 0 0 1 8.5 5.75Z"
                fill="currentColor"></path>
              <path
                d="M22.5 9h-21A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15h21a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 22.5 9ZM3.25 12a1.25 1.25 0 1 1 1.25 1.25A1.25 1.25 0 0 1 3.25 12Zm5.25 1.25A1.25 1.25 0 1 1 9.75 12a1.25 1.25 0 0 1-1.25 1.25Z"
                fill="currentColor"></path>
              <path
                d="M22.5 16.5h-21A1.5 1.5 0 0 0 0 18v3a1.5 1.5 0 0 0 1.5 1.5h21A1.5 1.5 0 0 0 24 21v-3a1.5 1.5 0 0 0-1.5-1.5Zm-19.25 3a1.25 1.25 0 1 1 1.25 1.25 1.25 1.25 0 0 1-1.25-1.25Zm5.25 1.25a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25Z"
                fill="currentColor"></path>
            </g>
          </svg>
          <span>CDN</span>
        </a>
        <a
          class="swagger-editor-integrations-item"
          href="https://github.com/scalar/scalar/tree/main#with-vuejs"
          target="_blank">
          <svg
            height="170"
            viewBox="0 0 196.3 170"
            width="196.3"
            xmlns="http://www.w3.org/2000/svg">
            <g
              fill="currentColor"
              fill-rule="nonzero">
              <polygon
                points="39.23 0 0 0 2.9450761 5.1010782 98.16 170.02 196.32 0 157.06 0 98.16 102.01 42.175701 5.0991171" />
              <polygon
                points="75.5 2.009956e-14 0 2.009956e-14 2.94 5.1 78.44871 5.1 98.16 39.26 117.87937 5.1 193.38 5.1 196.325 0 120.82 7.8065636e-15 114.97322 2.009956e-14 98.16 29.037153 81.35 2.009956e-14" />
            </g>
          </svg>
          <span>Vue</span>
        </a>
        <a
          class="swagger-editor-integrations-item"
          href="https://github.com/scalar/scalar/tree/main#with-react"
          target="_blank">
          <svg
            height="23.3"
            viewBox="0 0 22 23.3"
            width="22"
            xmlns="http://www.w3.org/2000/svg">
            <g
              fill="none"
              fill-rule="evenodd">
              <circle
                cx="11"
                cy="11.6"
                fill="currentColor"
                fill-rule="nonzero"
                r="2" />
              <g stroke="currentColor">
                <ellipse
                  cx="11"
                  cy="11.6"
                  rx="11"
                  ry="4.2" />
                <ellipse
                  cx="11"
                  cy="11.6"
                  rx="11"
                  ry="4.2"
                  transform="rotate(60 11 11.6)" />
                <ellipse
                  cx="11"
                  cy="11.6"
                  rx="11"
                  ry="4.2"
                  transform="rotate(120 11 11.6)" />
              </g>
            </g>
          </svg>
          <span>React</span>
        </a>
        <div class="swagger-editor-integrations-item">
          <svg
            height="62"
            viewBox="0 0 99.9 62"
            width="99.9"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M99.5 2h-1.7c-2.1 0-4.1 1-5.4 2.6L75 27.4 57.6 4.6A6.7 6.7 0 0 0 52.2 2h-1.7l22 28.7L50 60h1.7c2 0 4-1 5.3-2.6L75 34l17.9 23.4a6.7 6.7 0 0 0 5.3 2.6h1.7L77.5 30.7 99.5 2Zm-57 46.5a21 21 0 0 1-24.7 8.2A21.7 21.7 0 0 1 4 36.2V34h46v-8.3c0-13-9.6-24.4-22.6-25.6A25 25 0 0 0 0 25v11.1C0 47 6.4 57 16.5 60.5A25 25 0 0 0 48.3 46h-1.2c-1.9 0-3.5 1-4.5 2.5ZM4 25a21 21 0 0 1 42 0v5H4v-5Z"
              fill="currentColor"
              fill-rule="nonzero" />
          </svg>
          <span>Express</span>
        </div>
      </div>
    </div>
    <div class="swagger-editor-title swagger-editor-title-active">
      <div class="swagger-editor-title-type"><i>Swagger </i>Editor</div>
    </div>
    <!-- <div class="swagger-editor-title swagger-editor-title-active">
      <div class="swagger-editor-title-type"><i>AI </i>Writer</div>
    </div> -->
    <div
      class="swagger-editor-header-buttons"
      :class="{ 'swagger-editor-header-buttons__active': showIntegrations }">
      <div
        class="swagger-editor-title"
        @click="showIntegrations = !showIntegrations">
        <div class="swagger-editor-title-type">Integrations</div>
      </div>
    </div>
  </div>
  <div class="swagger-editor-title-buttons">
    <button
      type="button"
      @click="() => open()">
      Upload File
    </button>
    <button
      type="button"
      @click="swaggerURLModalState.show">
      Import URL
    </button>
    <button
      type="button"
      @click="useExample">
      Use Example
    </button>
  </div>
  <FlowModal
    :state="swaggerURLModalState"
    title="Import Swagger from URL">
    <div class="flex-col gap-1">
      <FlowTextField
        v-model="swaggerUrl"
        autofocus
        label="URL"
        placeholder="https://scalar.com/swagger.json" />
      <div class="flex-mobile gap-1">
        <FlowButton
          label="Cancel"
          variant="outlined"
          @click="swaggerURLModalState.hide()" />
        <FlowButton
          label="Import"
          @click="fetchURL" />
      </div>
    </div>
  </FlowModal>
</template>
<style>
.swagger-editor-header {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  flex-flow: wrap;
  position: relative;
}

.swagger-editor-header-buttons {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.swagger-editor-header span {
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-weight: 600;
  margin-right: 12px;
  position: relative;
  cursor: pointer;
}

.swagger-editor-title {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-mini, var(--default-theme-mini));
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}
.swagger-editor-title:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-title + .swagger-editor-title {
  margin-left: 6px;
}
.swagger-editor-title-type {
  padding: 9px;
  user-select: none;
  position: relative;
}
.swagger-editor-title-buttons {
  display: flex;
  justify-content: flex-end;
  padding: 6px 12px 0;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-title-active {
  background: var(--theme-background-2, var(--default-theme-background-2));
  cursor: default;
}
.swagger-editor-title-active .swagger-editor-title-type:after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 100%;
  height: 1px;
  background: currentColor;
}
.swagger-editor-title-buttons button {
  background: transparent;
  appearance: none;
  outline: none;
  border: none;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-3, var(--default-theme-color-3));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  padding: 4px 6px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-font-size-4, , var(--default-theme-font-size-4));
  user-select: none;
}
.swagger-editor-title-buttons button:hover {
  cursor: pointer;
  border-color: currentColor;
  background: var(--theme-background-3, var(--default-theme-background-3));
}
@media (max-width: 580px) {
  .swagger-editor-title i,
  .swagger-editor-header button i {
    display: none;
  }
  .swagger-editor-header button {
    padding: 4px 8px;
    margin-left: 6px;
  }
}
.swagger-editor-integrations {
  width: 100%;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  padding: 12px 0 0;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  margin-bottom: 12px;
  min-height: 100px;
  position: relative;
  user-select: none;
  background: var(--theme-background-1, var(--default-theme-background-1));
}
.swagger-editor-integrations-description {
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-2, var(--default-theme-color-2));
  display: block;
  padding-bottom: 12px;
  text-align: center;
  max-width: 270px;
  margin: 3px auto 0;
}
.swagger-editor-integrations b {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-font-size-2, var(--default-theme-font-size-2));
  color: var(--theme-color-1, var(--default-theme-color-1));
  text-align: center;
  display: block;
}
.swagger-editor-integrations-item {
  display: flex;
  align-items: center;
  font-size: var(--theme-micro, var(--default-theme-micro));
  padding: 12px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  color: var(--theme-color-1, var(--default-theme-color-1));
  z-index: 10;
  text-decoration: none;
}
.swagger-editor-integrations-item:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-integrations-item svg {
  margin-bottom: 6px;
  height: 48px;
  width: 48px;
  background: var(--theme-background-1, var(--default-theme-background-1));
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
}
.swagger-editor-integrations-list {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  display: flex;
  padding: 6px;
}
.swagger-editor-integrations-toggle {
  position: absolute;
  top: 0;
  right: 0;
  user-select: none;
  padding: 12px;
  color: var(--theme-color-ghost, var(--default-theme-color-ghost));
  cursor: pointer;
  width: 100px;
  display: flex;
  justify-content: flex-end;
}
.swagger-editor-integrations-toggle:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.swagger-editor-integrations-toggle svg {
  width: 12px;
}
.swagger-editor-header-buttons__active .swagger-editor-title:before {
  content: '';
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  position: absolute;
  right: 24px;
  top: -20px;
  box-shadow: 1px 1px 0
    var(--theme-border-color, var(--default-theme-border-color));
  background-color: var(
    --theme-background-1,
    var(--default-theme-background-1)
  );
}
</style>
