<script setup lang="ts">
import { ScalarIconInfo, ScalarIconX } from '@scalar/icons'
import { ref } from 'vue'

import { URLS } from '@/consts/urls'
import { useSignupLink } from '@/hooks/use-signup-link'

const isDismissed = ref(false)
const { signupLink } = useSignupLink()

/**
 * Dismiss the free messages info section.
 */
function dismiss() {
  isDismissed.value = true
}
</script>

<template>
  <div
    v-show="!isDismissed"
    class="freeMessagesInfoSection">
    <strong class="infoText">
      <!-- Sign up -->
      <ScalarIconInfo
        class="infoIcon text-blue size-4"
        weight="bold" />
      <span class="infoCopy">
        <a
          class="underline"
          :href="signupLink"
          target="_blank"
          >Sign up for Agent Scalar</a
        >
        to continue without hitting limits.
      </span>
    </strong>
    <div class="actionsContainer">
      <a
        class="actionButton upgradeButton"
        :href="URLS.AGENT_SCALAR_DOCUMENTATION"
        target="_blank"
        type="button">
        Read more
      </a>
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
  border-radius: var(--scalar-radius-3xl) var(--scalar-radius-3xl) 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.infoText {
  /* Let the copy flow as one wrapping sentence instead of a rigid single row:
     the text side takes the free space and shrinks (min-width: 0) so it wraps
     cleanly, while the actions keep their own line. */
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex: 1;
  min-width: 0;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
}

.infoIcon {
  flex-shrink: 0;
  margin-top: 1px;
}

.infoCopy {
  min-width: 0;
}

.actionsContainer {
  display: flex;
  align-items: center;
  gap: 8px;
  /* The Read more pill and close button never shrink or wrap into the copy. */
  flex-shrink: 0;
}

.actionButton {
  display: flex;
  align-items: center;
  font-weight: var(--scalar-semibold);
  border-radius: var(--scalar-radius-full);
  padding: 6px 12px;
  white-space: nowrap;
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
  border-radius: var(--scalar-radius-full);
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
