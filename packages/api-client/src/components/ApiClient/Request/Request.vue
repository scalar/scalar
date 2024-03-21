<script setup lang="ts">
import { computed } from 'vue'

import { getRequestFromAuthentication } from '../../../helpers'
import {
  useAuthenticationStore,
  useOpenApiStore,
  useRequestStore,
} from '../../../stores'
// import RequestAuth from './RequestAuth.vue'
import RequestBody from './RequestBody.vue'
import RequestCookies from './RequestCookies.vue'
import RequestHeaders from './RequestHeaders.vue'
import RequestQuery from './RequestQuery.vue'
import RequestVariables from './RequestVariables.vue'

const { activeRequest } = useRequestStore()
const { authentication } = useAuthenticationStore()
const {
  openApi: { operation, globalSecurity },
} = useOpenApiStore()

const authenticationRequest = computed(() => {
  return getRequestFromAuthentication(
    authentication,
    operation?.information?.security ?? globalSecurity,
  )
})

/**
 * TODO: This is a workaround to make the address bar editable, but not the rest. If we’d really like to have an
 * API client where everything can be edited, we need to invest more time.
 */
const readOnly = true
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
      <RequestVariables :variables="activeRequest.variables" />
      <!-- TODO: We need to put the UI from the reference here. Until then we can hide it. -->
      <!-- <RequestAuth /> -->
      <RequestCookies
        :cookies="activeRequest.cookies"
        :generatedCookies="authenticationRequest.cookies" />
      <RequestHeaders
        :generatedHeaders="authenticationRequest.headers"
        :headers="activeRequest.headers" />
      <RequestQuery
        :generatedQueries="authenticationRequest.queryString"
        :queries="activeRequest.query" />
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
  padding: 0 18px 12px 18px;
}
@media screen and (max-width: 820px) {
  .scalar-api-client__main__left {
    width: 100%;
    border-right: none;
    padding: 0 12px 12px 12px;
  }
}
.scalar-api-client__item__content {
  flex-flow: wrap;
  padding: 3px 9px 9px 9px;
  border-radius: 3px;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
  margin-top: -3px;
  justify-content: space-between;
  overflow: auto;
}
.scalar-api-client__item__content .scalar-api-client__codemirror__wrapper {
  width: 100%;
  min-height: 63px;
}
.scalar-api-client__item__content .scalar-codeblock-pre,
.scalar-api-client__item__content .cm-s-default {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.scalar-api-client__item__content .scalar-codeblock-pre,
.scalar-api-client__item__content .codemirror-container {
  width: 100%;
  max-height: calc(100vh - 300px);
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
  padding: 6px;
  width: fit-content;
  margin: 3px 3px 3px auto;
  text-transform: uppercase;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: white;
  cursor: pointer;
  text-align: center !important;
  position: relative;
}
.scalar-api-client__item__content-button span {
  position: relative;
}
.scalar-api-client__item__content-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  cursor: pointer;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
}
.scalar-api-client__item__content-button:hover:before {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1));
}
.scalar-api-client__item__content__split {
  justify-content: space-between;
}
.scalar-collapsible-section-flex {
  width: 100%;
}
.input {
  background: transparent;
  position: relative;
  width: 100%;
  text-align: left;
  display: flex;
  box-shadow: 0 1px 0
    var(--theme-border-color, var(--default-theme-border-color));
}
.input:focus-within {
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1)) !important;
  z-index: 10;
}
.input:first-of-type {
  border-radius: var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius)) 0 0;
}
.input:first-child:last-child {
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.input:last-child {
  box-shadow: none;
  border-radius: 0 0 var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius));
}
.input__half:first-of-type {
  border-radius: var(--theme-radius, var(--default-theme-radius)) 0 0 0;
}
.input__half:nth-of-type(2) {
  border-radius: 0 var(--theme-radius, var(--default-theme-radius)) 0 0;
}
.authentication-form {
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  width: 100%;
  display: flex;
  flex-flow: wrap;
}
.input__half {
  width: 50%;
}
.input__half + .input__half {
  border-left: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.input__half:focus-within {
  border-color: transparent;
}
.input label,
.input input {
  padding: 9px;
  border: 0;
  outline: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-2, var(--default-theme-color-2));
  width: 100%;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  left: 0;
}
.input label {
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: fit-content;
  padding-right: 0;
  white-space: nowrap;
  cursor: text;
}
.input input {
  position: relative;
  z-index: 99;
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
  right: 9px;
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
  left: 9px;
  top: 6px;
}
.select select {
  background: transparent;
  outline: none;
  border: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
  padding: 14px 9px 4px 9px;
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
  padding: 6px 9px;
  border-radius: 0 0 var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius));
  user-select: none;
  width: 100%;
  outline: none;
}
.check:focus-within {
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1));
}
.checkmark:hover {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.check:focus-within {
  border-color: var(--theme-color-1, var(--default-theme-color-1));
}
.check p {
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.check input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 17px;
  width: 17px;
  background: var(--theme-background-3, var(--default-theme-background-3));
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
