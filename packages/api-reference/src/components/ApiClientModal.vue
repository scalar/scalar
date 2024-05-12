<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { ScalarIcon } from '@scalar/components'
import type { ThemeId } from '@scalar/themes'
import { useMediaQuery } from '@vueuse/core'
import { defineAsyncComponent, ref } from 'vue'

import type { Spec } from '../types'
import { Sidebar } from './Sidebar'

defineProps<{
  parsedSpec: Spec
  overloadShow?: boolean
  proxyUrl?: string
  theme?: ThemeId
}>()

defineEmits<{
  (e: 'toggleDarkMode'): void
}>()

const LazyLoadedApiClient = defineAsyncComponent(() =>
  import('@scalar/api-client').then((m) => m.ApiClient),
)

const { hideApiClient, state } = useApiClientStore()

const isMobile = useMediaQuery('(max-width: 1000px)')
const showSideBar = ref(false)
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
        <LazyLoadedApiClient
          :proxyUrl="proxyUrl"
          :showSideBar="showSideBar"
          :theme="theme ?? 'none'"
          :withDefaultFonts="false"
          @escapeKeyPress="hideApiClient"
          @toggleSidebar="showSideBar = !showSideBar">
          <template #address-bar-controls>
            <div class="scalar-api-client-states">
              <button
                class="scalar-api-client-states-button scalar-api-client-states-button__endpoints"
                type="button"
                @click="showSideBar = !showSideBar">
                <ScalarIcon
                  :icon="showSideBar ? 'SideBarClosed' : 'SideBarOpen'"
                  size="sm" />
              </button>
              <button
                class="scalar-api-client-states-button"
                type="button"
                @click="hideApiClient">
                <ScalarIcon
                  icon="Close"
                  size="sm" />
              </button>
            </div>
          </template>
          <template #sidebar>
            <div class="t-doc__sidebar">
              <Sidebar
                v-show="!isMobile"
                :parsedSpec="parsedSpec">
                <!-- Pass up the sidebar slots -->
                <template #sidebar-start>
                  <slot name="sidebar-start" />
                </template>
              </Sidebar>
            </div>
          </template>
        </LazyLoadedApiClient>
      </div>
    </div>
  </div>
  <div
    v-if="state.showApiClient"
    class="api-client-drawer-exit"
    @click="hideApiClient"></div>
</template>

<style scoped>
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
  box-shadow: var(--scalar-shadow-1);
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
  height: calc(100% - 180px);
  width: calc(100% - 8px);
  max-width: 1280px;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  visibility: visible;
  position: fixed;
  z-index: 1001;
  opacity: 0;
  animation: apiclientfadein 0.35s forwards;
}
@media (min-width: 1520px) {
  .api-client-drawer {
    max-width: 80vw;
    max-width: 1720px;
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
    transform: translate3d(-50%, calc(-50% + 20px), 0) scale(0.985);
    opacity: 0;
  }
  to {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
.api-client-drawer-exit {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.44);
  transition: all 0.3s ease-in-out;
  z-index: 1000;
  cursor: pointer;
  animation: drawerexitfadein 0.35s forwards;
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
    top: calc(50% + 26px);
  }
}
@media (max-width: 820px) {
  .scalar-api-client-states-button__endpoints {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
