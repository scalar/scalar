<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { ScalarClientRequest, router, useWorkspace } from '@scalar/client-app'
import '@scalar/client-app/style.css'
import { fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import type { ThemeId } from '@scalar/themes'
import { getCurrentInstance, onMounted, ref } from 'vue'

import type { Spec } from '../types'

defineProps<{
  // parsedSpec: Spec
  overloadShow?: boolean
  // proxyUrl?: string
  // theme?: ThemeId
}>()
defineEmits<{
  (e: 'toggleDarkMode'): void
}>()
const { importSpecFile } = useWorkspace()
onMounted(async () => {
  const app = getCurrentInstance()
  app?.appContext.app.use(router)
  const spec = await fetchSpecFromUrl(
    'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  )
  importSpecFile(spec)
})

const newApiClient = ref(true)

const { hideApiClient, state } = useApiClientStore()
</script>
<template>
  <div
    v-if="state.showApiClient || overloadShow"
    class="api-client-drawer">
    <div class="api-client-container">
      <slot name="header" />
      <!-- <div class="scalar-api-client__navigation">
          <button
            class="scalar-api-client__close"
            type="button"
            @click="hideApiClient">
            <span>Back to Reference</span>
          </button>
        </div> -->
      <div class="scalar-api-client-height">
        <!-- Fonts are fetched by @scalar/api-reference already, we can safely set `withDefaultFonts: false` -->
        <template v-if="newApiClient">
          <ScalarClientRequest />
        </template>
      </div>
    </div>
  </div>
  <div
    v-if="state.showApiClient"
    class="api-client-drawer-exit"
    @click="hideApiClient"></div>
</template>

<style>
.api-client-container .scalar-api-client {
  --refs-sidebar-width: 280px;
  width: calc(100% - var(--refs-sidebar-width));
}
@media screen and (max-width: 1000px) {
  .api-client-container .scalar-api-client {
    width: 100%;
  }
}
.api-client-container {
  position: absolute;
  right: 0;
  left: 0;
  bottom: 0;
  top: 0;
  z-index: 9;
  border-radius: 0;
  box-shadow: none;
  opacity: 1;
  overflow: hidden;
  pointer-events: all;
  background: var(--scalar-background-1) !important;
  border-radius: var(--scalar-radius-lg);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  --refs-sidebar-width: 280px;
}
.scalar-api-client__navigation {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 11px 12px;
  height: var(--refs-header-height);
  background-color: var(--scalar-background-1);
  z-index: 10;
  position: sticky;
  border-bottom: 1px solid var(--scalar-border-color);
  top: 0;
}

.scalar-api-client__close {
  appearance: none;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  background: transparent;
  font-size: var(--scalar-small);
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}
.scalar-api-client__close:hover {
  cursor: pointer;
}
.api-client-drawer {
  background: var(--scalar-background-1);
  height: calc(100% - 120px);
  width: calc(100% - 8px);
  max-width: 1390px;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  visibility: visible;
  position: fixed;
  z-index: 1001;
  opacity: 0;
  animation: apiclientfadein 0.25s forwards 0.1s;
  box-shadow:
    rgba(0, 0, 0, 0.12) 0px 4px 30px,
    rgba(0, 0, 0, 0.04) 0px 3px 17px,
    rgba(0, 0, 0, 0.04) 0px 2px 8px,
    rgba(0, 0, 0, 0.04) 0px 1px 1px;
}
.dark-mode .api-client-drawer {
  border: 1px solid var(--scalar-border-color);
  box-shadow:
    rgba(0, 0, 0, 0.15) 0px 4px 40px,
    rgba(0, 0, 0, 0.184) 0px 3px 20px,
    rgba(0, 0, 0, 0.184) 0px 3px 12px,
    rgba(0, 0, 0, 0.184) 0px 2px 8px,
    rgba(0, 0, 0, 0.184) 0px 1px 1px;
}
@media (min-width: 1520px) {
  .api-client-drawer {
    width: 92vw;
    max-width: 1780px;
  }
}
.api-client-drawer:before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 0;
}
.dark-mode .api-client-drawer:before {
  background: #1a1a1a;
}
.light-mode .api-client-drawer:before {
  background: #fff;
}
@keyframes apiclientfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.api-client-drawer-exit {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1000;
  cursor: pointer;
  animation: drawerexitfadein 0.35s forwards;
}
.dark-mode .api-client-drawer-exit {
  background-color: color-mix(
    in srgb,
    rgba(0, 0, 0, 0.7),
    var(--scalar-background-1)
  );
}
@keyframes drawerexitfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.scalar-api-client-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.scalar-api-client-height .sidebar {
  flex: 1 1 0%;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0%;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: var(--refs-sidebar-width);
  max-width: var(--refs-sidebar-width);
  border-right: 1px solid
    var(--scalar-sidebar-border-color, var(--scalar-border-color));
}
.scalar-api-client-states {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  z-index: 1;
  position: absolute;
  top: 0;
  width: 100%;
}
.scalar-api-client-states-button {
  appearance: none;
  outline: none;
  border: none;
  min-height: 31px;
  display: flex;
  align-items: center;
  font-weight: var(--scalar-semibold);
  gap: 6px;
  padding: 6px;
  color: var(--scalar-color-3);
  cursor: pointer;
  border-radius: var(--scalar-radius);
  background: transparent;
}
.scalar-api-client-states-button:hover {
  color: var(--scalar-color-1);
}
.scalar-api-client-states-button:focus {
  background: var(--scalar-background-2);
  box-shadow: 0 0 0 1px var(--scalar-border-color);
}
@media (max-width: 1280px) {
  .api-client-drawer {
    height: calc(100% - 56px);
    top: 46px;
  }
}
@media (max-width: 820px) {
  .scalar-api-client-states-button__endpoints {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
