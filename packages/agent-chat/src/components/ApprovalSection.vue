<script setup lang="ts">
import { ScalarIconInfo } from '@scalar/icons'

const emit = defineEmits<{
  (e: 'approve'): void
  (e: 'reject'): void
}>()
</script>

<template>
  <div class="approvalSection">
    <strong class="approvalText flex items-center gap-1.5">
      <ScalarIconInfo
        class="text-blue size-4"
        weight="bold" />
      One or more requests require approval.
    </strong>
    <div class="approveContainer">
      <button
        type="button"
        class="actionButton rejectButton"
        @click="emit('reject')">
        Reject
      </button>
      <button
        type="button"
        class="actionButton approveButton"
        @click="emit('approve')">
        Approve
      </button>
    </div>
  </div>
</template>

<style scoped>
.approvalSection {
  width: 100%;
  margin-bottom: -16px;
  padding: 8px 8px 24px 12px;

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

.approveContainer {
  display: flex;
  gap: 5px;
}

.actionButton {
  display: flex;
  align-items: center;
  font-weight: var(--scalar-semibold);
  border-radius: 50px;
  padding: 6px 12px;
  font-size: var(--scalar-font-size-3);
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
</style>
