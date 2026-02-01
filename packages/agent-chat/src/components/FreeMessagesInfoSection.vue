<script setup lang="ts">
import { ScalarIconInfo, ScalarIconX } from '@scalar/icons'
import { ref } from 'vue'

import { useState } from '@/state/state'

const isDismissed = ref(false)
const { dashboardUrl, mode, uploadedTmpDocumentUrl } = useState()

function handleLearnMore() {
  const path = 'https://scalar.com/products/agent/getting-started'
  window.open(path, '_blank')
  if (mode === 'full') {
    window.location.replace(dashboardUrl)
  }

  if (mode === 'preview') {
    window.location.replace(
      uploadedTmpDocumentUrl.value
        ? `${dashboardUrl}/register?flow=oss-agent&docUrl=${uploadedTmpDocumentUrl.value}`
        : dashboardUrl,
    )
  }
}

function dismiss() {
  isDismissed.value = true
}
</script>

<template>
  <div
    v-show="!isDismissed"
    class="freeMessagesInfoSection">
    <strong class="infoText flex items-center gap-1.5">
      <ScalarIconInfo
        class="text-blue size-4"
        weight="bold" />
      Get an API Key to enable Agent Scalar for your docs.
    </strong>
    <div class="actionsContainer">
      <button
        class="actionButton upgradeButton"
        type="button"
        @click="handleLearnMore">
        Learn More
      </button>
      <button
        aria-label="Close"
        class="closeButton"
        type="button"
        @click="dismiss">
        <ScalarIconX
          class="size-4"
          weight="bold" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.freeMessagesInfoSection {
  width: 100%;
  margin-bottom: -16px;
  padding: 8px 8px 24px 12px;
  position: relative;
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    var(--scalar-background-1) 95%
  );
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.infoText {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
}

.actionsContainer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actionButton {
  display: flex;
  align-items: center;
  font-weight: var(--scalar-semibold);
  border-radius: 50px;
  padding: 6px 12px;
}

.upgradeButton {
  color: white;
  font-size: var(--scalar-font-size-3);
  background: var(--scalar-color-blue);
}
.upgradeButton:hover,
.upgradeButton:active {
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    var(--scalar-background-1) 10%
  );
  color: white !important;
}

.closeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--scalar-color-2);
  background: transparent;
  border: none;
  cursor: pointer;
}
.closeButton:hover {
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    var(--scalar-background-1) 80%
  );
  color: var(--scalar-color-1);
}
</style>
