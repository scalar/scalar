<script setup lang="ts">
import { ApiClient, useApiClientStore } from '@scalar/api-client'
import { useMediaQuery } from '@vueuse/core'

import { type Spec } from '../types'
import { default as Sidebar } from './Sidebar.vue'

defineProps<{ spec: Spec }>()

const { hideApiClient, state } = useApiClientStore()

const isMobile = useMediaQuery('(max-width: 1000px)')

const proxyUrl = import.meta.env.VITE_CLIENT_PROXY
</script>
<template>
  <div
    v-if="state.showApiClient"
    class="api-client-drawer">
    <div class="scalar-api-client__overlay">
      <div class="scalar-api-client__container">
        <!-- <div class="scalar-api-client__navigation">
          <button
            class="scalar-api-client__close"
            type="button"
            @click="hideApiClient">
            <span>Back to Reference</span>
          </button>
        </div> -->
        <div class="scalar-api-client-height flex flex-row">
          <Sidebar
            v-show="!isMobile"
            :spec="spec" />
          <ApiClient
            :proxyUrl="proxyUrl"
            @escapeKeyPress="hideApiClient" />
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="state.showApiClient"
    class="api-client-drawer-exit"
    @click="hideApiClient"></div>
</template>

<style scoped>
.scalar-api-client__container .scalar-api-client {
  width: calc(100% - var(--scalar-api-reference-theme-sidebar-width));
}

.scalar-api-client__container {
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
  background: var(--scalar-api-reference-theme-background-1) !important;
  border-radius: var(--scalar-api-reference-rounded);
  box-shadow: var(--scalar-api-reference-theme-shadow-1);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media screen and (max-width: 1265px) {
  .scalar-api-client__container {
    width: 100vw !important;
  }
}

.scalar-api-client__navigation {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 11px 12px;
  height: var(--scalar-api-reference-theme-header-height);
  background-color: var(--scalar-api-reference-theme-background-1);
  z-index: 10;
  position: sticky;
  border-bottom: var(--scalar-api-reference-border);
  top: 0;
}

.scalar-api-client__close {
  appearance: none;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  background: transparent;
  font-size: 14px;
  color: var(--scalar-api-reference-theme-color-1);
  font-weight: var(--scalar-api-reference-theme-semibold);
}
.scalar-api-client__close:hover {
  cursor: pointer;
}
/*
TODO: Markup is missing
.scalar-api-client__close__icon {
  width: 28px;
  height: 28px;
  border-radius: var(--scalar-api-reference-rounded);
  margin-right: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--scalar-api-reference-theme-color-2);
}
.scalar-api-client__close__icon:hover {
  background: var(--scalar-api-reference-theme-background-2);
}
.scalar-api-client__close__icon svg {
  width: 12px;
  height: 12px;
  transform: rotate(180deg);
} */
.api-client-drawer {
  background: var(--scalar-api-reference-theme-background-1);
  height: calc(100vh - 58px);
  width: calc(100vw - 8px);
  border-radius: 12px;
  overflow: hidden;
  visibility: visible;
  position: fixed;
  bottom: 4px;
  left: 4px;
  z-index: 9999;
  opacity: 0;
  animation: apiclientfadein 0.35s forwards;
}
@keyframes apiclientfadein {
  from {
    transform: translate3d(0, 20px, 0) scale(0.985);
    opacity: 0;
  }
  to {
    transform: translate3d(0, 0, 0) scale(1);
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
  z-index: 9998;
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
}
.scalar-api-client-height .sidebar {
  flex: 1 1 0%;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0%;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: var(--scalar-api-reference-theme-sidebar-width);
  border-right: 1px solid var(--scalar-api-reference-border-color);
}
</style>
