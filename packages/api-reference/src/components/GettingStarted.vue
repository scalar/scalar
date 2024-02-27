<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { type ThemeId } from '@scalar/themes'
import { ref, watch } from 'vue'

import petstore from '../specs/petstorev3.json'
import { type GettingStartedExamples } from '../types'

const props = defineProps<{
  theme: ThemeId
  value?: string
}>()

const emits = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'openSwaggerEditor', action?: 'importUrl' | 'uploadFile'): void
  (e: 'updateContent', value: string): void
}>()

const themeIds: ThemeId[] = [
  'default',
  'alternate',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'saturn',
  'kepler',
  'mars',
  'deepSpace',
]

const example = ref<GettingStartedExamples | null>(null)

// When the example id changes, update the content.
watch(example, () => {
  if (!example.value) {
    return
  }

  emits('updateContent', getContentForExample(example.value))
})

// Compares the content with the content for the given example id
function isActiveExample(exampleId: string | null) {
  if (exampleId === null) {
    return false
  }

  return getContentForExample(exampleId) === props.value
}

// Petstore -> { … }
function getContentForExample(exampleId: string) {
  if (exampleId === 'Petstore') {
    return JSON.stringify(petstore, null, 2)
  }

  return ''
}

watch(
  () => props.value,
  () => {
    if (isActiveExample(example.value)) {
      return
    }

    example.value = null
  },
)
</script>
<template>
  <div class="start custom-scroll">
    <div class="start-copy">
      <div class="start-logo">
        <svg
          height="36"
          viewBox="0 0 36 36"
          width="36"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 0a18 18 0 1 1 0 36 18 18 0 0 1 0-36Zm11.2 6.5c-3.3-3.3-11.1-1-17.4 5.3-6.2 6.3-8.6 14-5.3 17.4 3.3 3.3 11 .9 17.3-5.4 6.3-6.2 8.7-14 5.4-17.3ZM17.6 12a6.3 6.3 0 1 1 0 12.7 6.3 6.3 0 0 1 0-12.7Z"
            fill="currentColor"
            fill-rule="evenodd" />
        </svg>
      </div>
      <h1 class="start-h1">Swagger Editor</h1>
      <p class="start-p">
        Welcome to the Scalar API References + Swagger Editor, a Free &
        Open-Source tool that takes your Swagger/OAS file and generates
        Beautiful API references.
      </p>
      <div class="start-cta">
        <ScalarButton
          fullWidth
          @click="example = 'Petstore'">
          Test Petstore
        </ScalarButton>
        <ScalarButton
          fullWidth
          variant="outlined"
          @click="$emit('openSwaggerEditor', 'uploadFile')">
          Upload File
        </ScalarButton>
      </div>
    </div>
    <div class="start-row">
      <div class="start-section">
        <div class="start-h2">INTEGRATIONS</div>
        <a
          class="start-item"
          href="https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference#readme"
          target="_blank">
          <svg
            fill="currentColor"
            height="16"
            viewBox="0 0 19 16"
            width="19"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="m18.2 3.1.8-2V.9l-4.7 1.3C15.2 1 15 0 15 0s-2.5 1.6-4.3 1.5c-2 0-3.6.8-4 1-1.8 1.2-2.5 3.3-3.2 3.8L0 8.9 2.3 8l-2 2.5c.2.3 1.2 1.6 2.1 1.3l.4-.1 1.6.5-.7-1 .2-.2.9.3-.1-.8.9.3-.1-.8.3-.1 1-3.5 3.7-2.6-.3.7A4 4 0 0 1 8 7l-.6.2c-.5.5-.7.7-.8 2.5a2 2 0 0 1 1 0c1.6.4 2.2 2.3 1.7 2.9l-.7.6H8v.6h-.7v.5l-.2.2c-.7 0-1.4-.6-1.4-.6 0 .5.4 1.3.4 1.3s1.7 1.1 2.7.7c1-.4.7-2.3 2.8-3.2l3.3-.9.8-2.2-1.7.5v-2l2.5-.6.9-2.2-3.4.9v-2l4.2-1.1Z"
              fill="currentColor"
              fill-rule="nonzero" />
          </svg>
          <span>Fastify</span>
        </a>
        <a
          class="start-item"
          href="https://github.com/scalar/scalar/tree/main#from-a-cdn"
          target="_blank">
          <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <g>
              <path
                d="M22.5 1.5h-21A1.5 1.5 0 0 0 0 3v3a1.5 1.5 0 0 0 1.5 1.5h21A1.5 1.5 0 0 0 24 6V3a1.5 1.5 0 0 0-1.5-1.5Zm-19.25 3A1.25 1.25 0 1 1 4.5 5.75 1.25 1.25 0 0 1 3.25 4.5ZM8.5 5.75A1.25 1.25 0 1 1 9.75 4.5 1.25 1.25 0 0 1 8.5 5.75Z"
                fill="currentColor"></path>
              <path
                d="M22.5 9h-21A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15h21a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 22.5 9ZM3.25 12a1.25 1.25 0 1 1 1.25 1.25A1.25 1.25 0 0 1 3.25 12Zm5.25 1.25A1.25 1.25 0 1 1 9.75 12a1.25 1.25 0 0 1-1.25 1.25Z"
                fill="currentColor"></path>
              <path
                d="M22.5 16.5h-21A1.5 1.5 0 0 0 0 18v3a1.5 1.5 0 0 0 1.5 1.5h21A1.5 1.5 0 0 0 24 21v-3a1.5 1.5 0 0 0-1.5-1.5Zm-19.25 3a1.25 1.25 0 1 1 1.25 1.25 1.25 1.25 0 0 1-1.25-1.25Zm5.25 1.25a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25Z"
                fill="currentColor"></path>
            </g>
          </svg>
          <span>CDN</span>
        </a>
        <a
          class="start-item"
          href="https://github.com/scalar/scalar/tree/main#with-vuejs"
          target="_blank">
          <svg
            height="170"
            viewBox="0 0 196.3 170"
            width="196.3"
            xmlns="http://www.w3.org/2000/svg">
            <g
              fill="currentColor"
              fill-rule="nonzero">
              <polygon
                points="39.23 0 0 0 2.9450761 5.1010782 98.16 170.02 196.32 0 157.06 0 98.16 102.01 42.175701 5.0991171" />
              <polygon
                points="75.5 2.009956e-14 0 2.009956e-14 2.94 5.1 78.44871 5.1 98.16 39.26 117.87937 5.1 193.38 5.1 196.325 0 120.82 7.8065636e-15 114.97322 2.009956e-14 98.16 29.037153 81.35 2.009956e-14" />
            </g>
          </svg>
          <span>Vue</span>
        </a>
        <a
          class="start-item"
          href="https://github.com/scalar/scalar/tree/main#with-react"
          target="_blank">
          <svg
            height="23.3"
            viewBox="0 0 22 23.3"
            width="22"
            xmlns="http://www.w3.org/2000/svg">
            <g
              fill="none"
              fill-rule="evenodd">
              <circle
                cx="11"
                cy="11.6"
                fill="currentColor"
                fill-rule="nonzero"
                r="2" />
              <g stroke="currentColor">
                <ellipse
                  cx="11"
                  cy="11.6"
                  rx="11"
                  ry="4.2" />
                <ellipse
                  cx="11"
                  cy="11.6"
                  rx="11"
                  ry="4.2"
                  transform="rotate(60 11 11.6)" />
                <ellipse
                  cx="11"
                  cy="11.6"
                  rx="11"
                  ry="4.2"
                  transform="rotate(120 11 11.6)" />
              </g>
            </g>
          </svg>
          <span>React</span>
        </a>
        <!-- <div class="start-item">
            <svg
              height="62"
              viewBox="0 0 99.9 62"
              width="99.9"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M99.5 2h-1.7c-2.1 0-4.1 1-5.4 2.6L75 27.4 57.6 4.6A6.7 6.7 0 0 0 52.2 2h-1.7l22 28.7L50 60h1.7c2 0 4-1 5.3-2.6L75 34l17.9 23.4a6.7 6.7 0 0 0 5.3 2.6h1.7L77.5 30.7 99.5 2Zm-57 46.5a21 21 0 0 1-24.7 8.2A21.7 21.7 0 0 1 4 36.2V34h46v-8.3c0-13-9.6-24.4-22.6-25.6A25 25 0 0 0 0 25v11.1C0 47 6.4 57 16.5 60.5A25 25 0 0 0 48.3 46h-1.2c-1.9 0-3.5 1-4.5 2.5ZM4 25a21 21 0 0 1 42 0v5H4v-5Z"
                fill="currentColor"
                fill-rule="nonzero" />
            </svg>
            <span>Express</span>
          </div> -->
      </div>
      <div class="start-section start-section-colors">
        <p class="start-h2">THEMING</p>
        <div
          v-for="themeId in themeIds"
          :key="themeId"
          class="start-item"
          :class="{ 'start-item-active': themeId === theme }"
          @click="$emit('changeTheme', themeId)">
          {{ themeId.toLocaleLowerCase() }}
        </div>
        <!-- <p class="start-item-copy">
          Add your own typography & color palettes, or use some of our prebuilt
          themes!
        </p> -->
      </div>
    </div>
    <p class="start-h1">Features</p>
    <ul class="start-ul">
      <li>
        <p class="start-h3">Customize</p>
        Bring your typography & color palettes, or use our themes!
      </li>
      <li>
        <p class="start-h3">Testing</p>
        A deeply integrated Rest API Client (Also Free & Open-Source)
      </li>
      <li>
        <p class="start-h3">Search</p>
        Fully integrated Search (Using fuse.js)
      </li>
      <li>
        <p class="start-h3">Hosting</p>
        Free subdomain hosting on https://apidocumentation.com
      </li>
      <li>
        <p class="start-h3">Openapi & Swagger</p>
        Support for OpenAPI 3.1, OpenAPI 3.0, and Swagger 2.0
      </li>
      <li>
        <p class="start-h3">Code Samples</p>
        Code samples to show off your API in most popular languages
      </li>
    </ul>
  </div>
</template>
<style scoped>
.start {
  padding: 24px;
  display: flex;
  flex-flow: wrap;
  justify-content: space-between;
  position: relative;
  z-index: 0;
}
.swagger-editor .start {
  padding-top: 24px;
}
.start-h1 {
  font-size: var(--theme-heading-2, var(--default-theme-heading-2));
  margin-top: 0;
  line-height: 1.45;
  margin-bottom: 0;
  font-weight: var(--theme-bold, var(--default-theme-bold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
  position: relative;
}
.start-h3 {
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  margin-top: 0;
  margin-bottom: 6px;
  display: block;
  line-height: 1.45;
  font-weight: var(--theme-bold, var(--default-theme-bold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
}
.start-h1:not(:first-of-type) {
  margin-top: 24px;
}
.start-p {
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.5;
  width: 100%;
  margin-top: 12px;
}
.start-ul {
  margin-top: 12px;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  line-height: 1.5;
  padding-left: 0;
  list-style: initial;
  display: flex;
  flex-flow: wrap;
  gap: 24px;
}
.start-ul li {
  margin: 0;
  padding: 0;
  list-style: none;
  width: calc(50% - 24px);
  color: var(--theme-color-2, var(--default-theme-color-2));
}
.start-ul li:first-of-type {
  margin-top: 0;
}
.start-section {
  width: 100%;
  margin-bottom: 12px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  display: flex;
  flex-flow: wrap;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.start-section:last-of-type {
  margin-bottom: 48px;
}
.start-h2 {
  padding: 9px;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  width: 100%;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.start-item {
  padding: 9px;
  display: flex;
  align-items: center;
  user-select: none;
  cursor: pointer;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  flex: 1;
  text-transform: capitalize;
}
.start-section-colors .start-item {
  min-width: 33.33%;
}
.start-item:not(:last-of-type) {
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.start-section-colors .start-item:not(:last-of-type) {
  border-right: none;
}
.start-section-colors .start-item:not(:nth-of-type(3n)) {
  border-right: 1px solid var(--default-theme-border-color);
}
.start-section-colors .start-item:nth-of-type(n + 4) {
  border-top: 1px solid var(--default-theme-border-color);
}
.start-item:empty {
  pointer-events: none;
}
.start-item svg {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}
.start-item:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.start-item-active {
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1));
  z-index: 10;
  position: relative;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.start-section-color .start-item {
  text-transform: capitalize;
}
.start-cta {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 24px;
  margin-bottom: 0;
}
.start-section:nth-of-type(2) {
  border-left: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.start-row {
  width: 100%;
  margin-top: 12px;
  overflow: hidden;
}
.start-hero-copy {
  background: var(--theme-background-2, var(--default-theme-background-2));
  padding: 12px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.start-p-small {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  margin-bottom: 12px;
  line-height: 1.4;
}
.start-cta {
  margin-bottom: 12px;
  width: fit-content;
  white-space: nowrap;
}
.start-copy {
  padding: 76px 48px 48px 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}
.start-logo {
  color: var(--theme-color-1, var(--default-theme-color-1));
  margin-bottom: 24px;
  width: 72px;
  aspect-ratio: 1;
  position: relative;
  box-shadow: var(--theme-shadow-2, var(--default-theme-shadow-2));
  border-radius: 50%;
}
.start-logo:before {
  content: '';
  width: 300%;
  aspect-ratio: 1;
  left: -100%;
  top: -100%;
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  background-size: 24px 24px;
  box-shadow:
    inset 0 0 50px var(--theme-background-1, var(--default-theme-background-1)),
    inset 0 0 50px var(--theme-background-1, var(--default-theme-background-1));
  background-image: linear-gradient(
      to right,
      var(--theme-border-color, var(--default-theme-border-color)) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      var(--theme-border-color, var(--default-theme-border-color)) 1px,
      transparent 1px
    );
}
.start-logo svg {
  width: 100%;
  height: auto;
  background: var(--theme-background-1, var(--default-theme-background-1));
  padding: 3px;
  border-radius: 50%;
  position: relative;
}
@media screen and (max-width: 600px) {
  .start-section-colors .start-item,
  .start-item {
    width: 100%;
    border-radius: 0;
    border-right: none;
    border-top: 1px solid
      var(--theme-border-color, var(--default-theme-border-color));
  }
  .start-item:empty {
    display: none;
  }
  .start-h2 {
    border-bottom: none;
  }
  .start li {
    width: 100%;
  }
  .start-copy {
    padding: 48px 0 24px 0;
  }
}
@media screen and (max-width: 1000px) {
  .start {
    padding: 0;
    overflow: auto;
  }
}
</style>
