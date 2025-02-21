<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { type ThemeId, themeLabels } from '@scalar/themes'

defineProps<{
  theme: ThemeId
}>()
const emits = defineEmits<{
  (e: 'changeTheme', { id, label }: { id: ThemeId; label: string }): void
  (e: 'loadSwaggerFile'): void
  (e: 'linkSwaggerFile'): void
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

async function fetchExampleSpecification() {
  const response = await fetch(
    'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  )

  emits('updateContent', await response.text())
}
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
          @click="fetchExampleSpecification">
          Show Example
        </ScalarButton>
        <ScalarButton
          fullWidth
          variant="outlined"
          @click="$emit('loadSwaggerFile')">
          Upload File
        </ScalarButton>
      </div>
    </div>
    <div class="start-row">
      <div class="start-section start-section-integrations">
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
      </div>
      <div class="start-section start-section-colors">
        <p class="start-h2">THEMING</p>
        <div
          v-for="themeId in themeIds"
          :key="themeId"
          class="start-item"
          :class="{ 'start-item-active': themeId === theme }"
          @click="
            $emit('changeTheme', { id: themeId, label: themeLabels[themeId] })
          ">
          {{ themeLabels[themeId] }}
        </div>
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
        <p class="start-h3">OpenAPI & Swagger</p>
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
  font-size: var(--scalar-heading-2);
  margin-top: 0;
  line-height: 1.45;
  margin-bottom: 0;
  font-weight: var(--scalar-bold);
  color: var(--scalar-color-1);
  width: 100%;
  position: relative;
}
.start-h3 {
  font-size: var(--scalar-paragraph);
  margin-top: 0;
  margin-bottom: 6px;
  display: block;
  line-height: 1.45;
  font-weight: var(--scalar-bold);
  color: var(--scalar-color-1);
  width: 100%;
}
.start-h1:not(:first-of-type) {
  margin-top: 24px;
}
.start-p {
  font-size: var(--scalar-paragraph);
  color: var(--scalar-color-2);
  line-height: 1.5;
  width: 100%;
  margin-top: 12px;
}
.start-ul {
  margin-top: 12px;
  font-size: var(--scalar-paragraph);
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
  color: var(--scalar-color-2);
}
.start-ul li:first-of-type {
  margin-top: 0;
}
.start-section {
  width: 100%;
  margin-bottom: 12px;
  display: flex;
  flex-flow: wrap;
}
.start-section:last-of-type {
  margin-bottom: 48px;
}
.start-h2 {
  background: var(--scalar-background-2);
  border-top-left-radius: var(--scalar-radius-lg);
  border-top-right-radius: var(--scalar-radius-lg);
  border: 1px solid var(--scalar-border-color);
  color: var(--scalar-color-3);
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  padding: 9px;
  width: 100%;
}
.start-item {
  align-items: center;
  background: var(--scalar-background-2);
  border-right: 1px solid var(--scalar-border-color);
  border-bottom: 1px solid var(--scalar-border-color);
  color: var(--scalar-color-1);
  cursor: pointer;
  display: flex;
  flex: 1;
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  padding: 9px;
  text-transform: capitalize;
  user-select: none;
}
.start-section-integrations .start-item:first-of-type {
  border-bottom-left-radius: var(--scalar-radius-lg);
  border-left: 1px solid var(--scalar-border-color);
}
.start-section-integrations .start-item:last-of-type {
  border-bottom-right-radius: var(--scalar-radius-lg);
}
.start-section-colors .start-item {
  min-width: 33.33%;
}
.start-section-colors .start-item:nth-child(3n + 2) {
  border-left: 1px solid var(--scalar-border-color);
}
.start-section-colors .start-item:last-of-type,
.start-section-colors .start-item-active:last-of-type::before {
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
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
  background: var(--scalar-background-3);
}
.start-item-active {
  z-index: 10;
  position: relative;
  color: var(--scalar-color-1);
}
.start-item-active::before {
  border: 1px solid var(--scalar-color-1);
  content: '';
  inset: -1px -1px -1px -1px;
  pointer-events: none;
  position: absolute;
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
.start-row {
  width: 100%;
  margin-top: 12px;
  overflow: hidden;
}
.start-hero-copy {
  background: var(--scalar-background-2);
  padding: 12px;
  border-radius: var(--scalar-radius-lg);
}
.start-p-small {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
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
  color: var(--scalar-color-1);
  margin-bottom: 24px;
  width: 72px;
  aspect-ratio: 1;
  position: relative;
  box-shadow: var(--scalar-shadow-2);
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
    inset 0 0 50px var(--scalar-background-1),
    inset 0 0 50px var(--scalar-background-1);
  background-image: linear-gradient(
      to right,
      var(--scalar-border-color) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, var(--scalar-border-color) 1px, transparent 1px);
}
.start-logo svg {
  width: 100%;
  height: auto;
  background: var(--scalar-background-1);
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
    border-top: 1px solid var(--scalar-border-color);
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
