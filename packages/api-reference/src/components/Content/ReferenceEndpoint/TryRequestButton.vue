<script setup lang="ts">
import { FlowIcon } from '../../../components/Icon'
import { openClientFor } from '../../../helpers'
import { type TransformedOperation } from '../../../types'

defineProps<{
  operation: TransformedOperation
}>()
</script>
<template>
  <button
    class="show-api-client-button"
    :class="`show-api-client-button--${operation.httpVerb}`"
    type="button"
    @click.stop="openClientFor(operation)">
    <span>Test Request</span>
    <FlowIcon icon="PaperAirplane" />
  </button>
</template>
<style scoped>
.show-api-client-button {
  appearance: none;
  outline: none;
  border: none;
  padding: 6px;
  height: 23px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-background-2, var(--default-background-2));
  font-family: var(--theme-font, var(--default-theme-font));
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}
.show-api-client-button span,
.show-api-client-button svg {
  color: #fff;
  z-index: 1;
}
.show-api-client-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  cursor: pointer;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.show-api-client-button:before {
  background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
}
.show-api-client-button:hover:before {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1));
}
.show-api-client-button svg {
  height: 12px;
  width: auto;
  margin-left: 9px;
}
.show-api-client-button--post {
  background: var(--theme-color-green, var(--default-theme-color-green));
}
.show-api-client-button--patch {
  background: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.show-api-client-button--get {
  background: var(--theme-color-blue, var(--default-theme-color-blue));
}
.show-api-client-button--delete {
  background: var(--theme-color-red, var(--default-theme-color-red));
}
.show-api-client-button--put {
  background: var(--theme-color-orange, var(--default-theme-color-orange));
}
</style>
