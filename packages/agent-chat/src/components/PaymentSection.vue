<script setup lang="ts">
import { ScalarIconInfo } from '@scalar/icons'

import { useState } from '@/state/state'

const { dashboardUrl, mode, uploadedTmpDocumentUrl } = useState()

function handleUpgrade() {
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
</script>

<template>
  <div class="paymentSection">
    <strong class="approvalText flex items-center gap-1.5">
      <ScalarIconInfo
        class="text-blue size-4"
        weight="bold" />
      You've used up all your free messages, upgrade for $24/mo.
    </strong>
    <div class="paymentContainer">
      <button
        class="actionButton approveButton"
        type="button"
        @click="handleUpgrade">
        Upgrade
      </button>
      <div class="paymentInfo">
        <h3>$24 <span>/ month</span></h3>
        <div class="paymentInfoSection">
          <div class="paymentInfoItem">
            <span>Members in your workspace</span>
            <span>1</span>
          </div>
          <div class="paymentInfoItem">
            <span>x $24 / month / member</span>
            <span>$24.00</span>
          </div>
        </div>
        <div class="paymentInfoSection">
          <div class="paymentInfoItem">
            <span>Messages</span>
            <span>1,000</span>
          </div>
          <div class="paymentInfoItem">
            <span>Additional Messages</span>
            <span>+ $0.02 Message</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paymentSection {
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
  position: absolute;
  top: 0;
  transform: translate3d(0, calc(-100% + 16px), 0);
}

.approvalText {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
}

.paymentContainer {
  display: flex;
  gap: 5px;
}

.actionButton {
  display: flex;
  align-items: center;
  font-weight: var(--scalar-semibold);
  border-radius: 50px;
  padding: 6px 12px;
}

.rejectButton {
  color: white;
  background: var(--scalar-color-red);
}
.rejectButton:hover,
.rejectButton:active {
  background: color-mix(
    in srgb,
    var(--scalar-color-red),
    var(--scalar-background-1) 10%
  );
  color: white !important;
}

.approveButton {
  color: white;
  font-size: var(--scalar-font-size-3);
  background: var(--scalar-color-blue);
}
.approveButton:hover,
.approveButton:active {
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    var(--scalar-background-1) 10%
  );
  color: white !important;
}
.paymentInfo {
  width: 300px;
  position: absolute;
  right: 0;
  bottom: 70px;
  box-shadow: var(--scalar-shadow-2);
  background: var(--scalar-background-1);
  border-radius: 16px;
  pointer-events: none;
  padding: 12px;
  transform: translate3d(0, -5px, 0);
  opacity: 0;
  transition: all 0.2s ease-in-out;
}
.paymentInfo h3 {
  font-size: var(--scalar-font-size-1);
  font-weight: var(--scalar-bold);
  margin-bottom: 18px;
}
.paymentInfo h3 span {
  font-size: var(--scalar-font-size-2);
}
.dark-mode .paymentInfo {
  background: var(--scalar-background-2);
}
.paymentContainer:hover .paymentInfo {
  transform: translate3d(0, 0, 0);
  opacity: 1;
}
.paymentInfoItem {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
}
.paymentInfoSection:not(:last-child) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  padding-bottom: 8px;
}
</style>
