<script setup lang="ts">
import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import RequestAuth from './RequestAuth.vue'
import RequestBody from './RequestBody.vue'
import RequestHeaders from './RequestHeaders.vue'
import RequestQuery from './RequestQuery.vue'
import RequestVariables from './RequestVariables.vue'

const { activeRequest, readOnly } = useApiClientRequestStore()
</script>
<template>
  <div class="scalar-api-client__main__left custom-scroll">
    <div class="scalar-api-client__main__content">
      <label>Request</label>
      <div class="meta">
        <div class="meta-item meta-item__input">
          <input
            v-model="activeRequest.name"
            class="scalar-api-client__request-name"
            :disabled="readOnly"
            placeholder="Request Name"
            type="text" />
        </div>
      </div>
    </div>
    <div>
      <RequestAuth />
      <RequestVariables :variables="activeRequest.parameters" />
      <RequestQuery :queries="activeRequest.query" />
      <RequestHeaders :headers="activeRequest.headers" />
      <RequestBody
        :body="activeRequest.body"
        :formData="activeRequest.formData"
        :requestBody="activeRequest.body" />
      <div class="scalar-api-client__main__scroll-container" />
    </div>
  </div>
</template>
<style>
.scalar-api-client__main__left {
  width: 50%;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  padding: 0 0 12px 12px;
}
@media screen and (max-width: 820px) {
  .scalar-api-client__main__left {
    width: 100%;
    border-right: none;
  }
}
.scalar-api-client__item__content {
  flex-flow: wrap;
  padding: 0 12px 12px;
  border-radius: 3px;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
  margin-top: -3px;
  justify-content: space-between;
}
.scalar-api-client__item__content .scalar-api-client__codemirror__wrapper {
  min-height: 63px;
}
.scalar-api-client__item__content .cm-s-default {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.scalar-api-client__item__content .scalar-api-client__item__content--code {
  width: 100%;
  max-height: calc(100vh - 200px);
  overflow: auto;
}
.scalar-api-client__item__content .cm-scroller {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: 3px;
}
.scalar-api-client__item__content .cm-editor {
  outline: none !important;
}
.scalar-api-client__item__content .cm-editor .cm-gutters {
  background: transparent;
}
.scalar-api-client__item__content .cm-scroll {
  background: transparent;
}
.scalar-api-client__item__content .cm-editor * {
  font-size: var(--theme-micro, var(--default-theme-micro));
}
.scalar-api-client__item__content .cm-editor .cm-line {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.scalar-api-client__item__content-button {
  width: 100%;
  appearance: none;
  border: none;
  outline: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(
    --scalar-api-client-color,
    var(--default-scalar-api-client-color)
  ) !important;
  text-align: center;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-family: var(--theme-font, var(--default-theme-font));
  padding: 12px;
  text-transform: uppercase;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: white;
  cursor: pointer;
  text-align: center !important;
}
.scalar-api-client__item__content__split {
  justify-content: space-between;
}
.scalar-collapsible-section-flex {
  width: 100%;
}
.input {
  background: var(--theme-background-2, var(--default-theme-background-2));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  position: relative;
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
}
.input__half {
  width: calc(50% - 3px);
}
.input:focus-within {
  border-color: var(--theme-color-1, var(--default-theme-color-1));
}
.input label,
.input input {
  padding: 12px;
  border: 0;
  outline: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  left: 0;
}
.input label {
  position: absolute;
  color: var(--theme-color-2, var(--default-theme-color-2));
}
.input input {
  opacity: 0;
  position: relative;
  z-index: 99;
  padding: 18px 12px 6px 12px;
}
.input input:not(:placeholder-shown),
.input:focus-within input {
  opacity: 1;
}
.input input:not(:placeholder-shown) + label,
.input:focus-within label {
  font-size: 10px;
  top: -6px;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.input input:not(:placeholder-shown) + label {
  color: var(--theme-color-2, var(--default-theme-color-2));
}
.select {
  background: --theme-background-1;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  font-size: var(--theme-micro, var(--default-theme-micro));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  width: 100%;
  position: relative;
  margin-bottom: 6px;
}
.select:focus-within {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.select:hover {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.select svg {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: var(--theme-color-2, var(--default-theme-color-2));
  width: 6px;
  top: 10px;
}
.select label {
  display: block;
  font-size: 10px;
  color: var(--theme-color-2, var(--default-theme-color-2));
  position: absolute;
  left: 12px;
  top: 6px;
}
.select select {
  background: transparent;
  outline: none;
  border: none;
  -webkit-appearance: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-1, var(--default-theme-color-1));
  appearance: none;
  width: 100%;
  padding: 18px 12px 6px 12px;
  top: 0;
  position: relative;
  cursor: pointer;
}

.check {
  display: flex;
  position: relative;
  cursor: pointer;
  align-items: center;
  font-size: var(--theme-micro, var(--default-theme-micro));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: 3px;
  padding: 11px 12px;
  user-select: none;
  min-height: 38px;
  width: 100%;
}
.check:focus-within {
  border-color: var(--theme-color-1, var(--default-theme-color-1));
}
.check p {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
.check input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 15px;
  width: 15px;
  background: var(--theme-background-1, var(--default-theme-background-1));
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  margin-right: 10px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.check input:checked ~ p {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.check .checkmark:after {
  content: '';
  display: none;
  width: 5px;
  height: 8px;
  border: solid var(--theme-color-1, var(--default-theme-color-1));
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translate3d(0, -1px, 0);
}
.check input:checked ~ .checkmark:after {
  display: block;
}
.scalar-api-client__main__scroll-container {
  height: calc(100vh - 320px);
}
.scalar-api-client__request-name {
  outline: none;
  border: none;
  appearance: none;
  -webkit-appearance: none;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-small, var(--default-theme-small));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-3, var(--default-theme-color-3));
  width: 100%;
  padding: 0;
  background: transparent;
  font-family: var(--theme-font, var(--default-theme-font));
}
.scalar-api-client__request-name::-webkit-input-placeholder {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
.scalar-api-client__request-name:-ms-input-placeholder {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
.scalar-api-client__request-name::placeholder {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
</style>
