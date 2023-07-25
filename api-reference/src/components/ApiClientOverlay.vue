<script setup lang="ts">
import { ApiClient, useApiClientStore } from '@scalar/api-client'

import FlowDrawer from '@lib/components/FlowDrawer.vue'

import { type Spec } from '../types'
import { default as Sidebar } from './Sidebar.vue'

defineProps<{ spec: Spec }>()

const { hideApiClient, state } = useApiClientStore()
</script>
<template>
  <FlowDrawer
    :open="state.showApiClient"
    @close="hideApiClient">
    <div class="scalar-api-client__overlay">
      <div class="scalar-api-client__container">
        <div class="scalar-api-client__navigation">
          <button
            class="scalar-api-client__close"
            type="button"
            @click="hideApiClient">
            <span>Back to Reference</span>
          </button>
        </div>
        <div class="flex flex-row">
          <Sidebar :spec="spec" />
          <ApiClient @escapeKeyPress="hideApiClient" />
        </div>
      </div>
    </div>
  </FlowDrawer>
</template>

<style>
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
  background: var(--theme-background-1) !important;
  border-radius: var(--theme-radius);
  box-shadow: var(--theme-shadow-1);
  height: 100%;
  overflow: hidden;
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
  max-height: var(--theme-header-height);
  background-color: var(--theme-background-1);
  z-index: 10;
  position: sticky;
  border-bottom: var(--theme-border);
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
  color: var(--theme-color-1);
  font-weight: var(--theme-semibold);
}
.scalar-api-client__close:hover {
  cursor: pointer;
}
/*
TODO: Markup is missing
.scalar-api-client__close__icon {
  width: 28px;
  height: 28px;
  border-radius: var(--theme-radius);
  margin-right: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--theme-color-2);
}
.scalar-api-client__close__icon:hover {
  background: var(--theme-background-2);
}
.scalar-api-client__close__icon svg {
  width: 12px;
  height: 12px;
  transform: rotate(180deg);
} */
</style>
