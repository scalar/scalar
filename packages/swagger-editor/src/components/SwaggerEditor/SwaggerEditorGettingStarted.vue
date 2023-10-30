<script setup lang="ts">
import { type ThemeId } from '@scalar/themes'
import { ref, watch } from 'vue'

import { type GettingStartedExamples } from '../../types'
import FlowButton from '../FlowButton.vue'

defineProps<{
  theme: ThemeId
}>()

const emits = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'openSwaggerEditor', action?: 'importUrl' | 'uploadFile'): void
  (e: 'changeExample', value: GettingStartedExamples): void
}>()

const themeIds: ThemeId[] = [
  'default',
  'alternate',
  'moon',
  'purple',
  'solarized',
]

const activeExample = ref<GettingStartedExamples | null>(null)

watch(activeExample, () => {
  if (activeExample.value) {
    emits('changeExample', activeExample.value)
  }
})
</script>
<template>
  <div class="start custom-scroll">
    <h1 class="start-h1">Swagger Editor</h1>
    <p class="start-p">
      Welcome to the Scalar API References + Swagger Editor, a Free &
      Open-Source tool that takes your Swagger/OAS file and generates Beautiful
      API references.
    </p>
    <div class="start-cta flex flex-row gap-1">
      <FlowButton
        label="Test Petstore"
        @click="activeExample = 'Petstore'" />
      <FlowButton
        label="Upload File"
        variant="outlined"
        @click="$emit('openSwaggerEditor', 'uploadFile')" />
    </div>
    <div class="start-row">
      <div class="start-section">
        <div class="start-h2">EXAMPLES</div>
        <div
          class="start-item"
          :class="{ 'start-item-active': activeExample === 'Petstore' }"
          @click="activeExample = 'Petstore'">
          <svg
            baseProfile="tiny"
            fill="currentColor"
            height="800"
            overflow="inherit"
            version="1.2"
            viewBox="0 0 50 50"
            width="800"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M25 21.5a6 6 0 0 1 5.8 4.4c.9 3.3.7 6.8 4.4 8.6 3.3 1.1 4.5 2.5 4.5 6.3a7 7 0 0 1-5.8 6.5c-3.7.6-6.6-.1-8.9-1.5-2.3 1.4-5.2 2-8.9 1.5a7 7 0 0 1-5.8-6.5c0-3.7 1.3-5.2 4.6-6.3 4-2 3.4-5.6 4.3-8.7a6 6 0 0 1 5.8-4.3zm18.4-2.3c-1-.8-5 2.6-6.4 4.2-.7 1-1.2 2.1-1.2 3.5 0 2.7 2 4.9 4.3 4.9 1.8 0 3.4-1.3 4-3 1.3-3.3 1.3-7.7-.7-9.6zm-36.8 0c-2 1.9-2 6.3-.7 9.5.6 1.8 2.2 3 4 3 2.4 0 4.3-2.1 4.3-4.8 0-1.4-.5-2.6-1.2-3.5-1.3-1.6-5.4-5-6.4-4.2zM30.3 1.5c10.1 1.8 9.4 18.7 1.3 17.4-2.3-.4-4-2.5-4.3-5-.3-2.7-.9-13 3-12.4zm-10.6 0c3.9-.6 3.3 9.7 3 12.3-.3 2.6-2 4.7-4.3 5-8.1 1.4-8.8-15.5 1.3-17.3z" />
          </svg>
          Petstore
        </div>
        <div
          class="start-item"
          :class="{ 'start-item-active': activeExample === 'Tableau' }"
          @click="activeExample = 'Tableau'">
          <svg
            height="2478.8"
            viewBox="0 0 2500 2478.8"
            width="2500"
            xmlns="http://www.w3.org/2000/svg">
            <g
              fill="currentColor"
              fill-rule="evenodd">
              <polygon
                fill-rule="nonzero"
                points="1181.59204 1674.7199 1318.40796 1674.7199 1318.40796 1299.74511 1662.52073 1299.74511 1662.52073 1166.42074 1318.40796 1166.42074 1318.40796 791.44595 1181.59204 791.44595 1181.59204 1166.42074 841.625207 1166.42074 841.625207 1299.74511 1181.59204 1299.74511" />
              <polygon
                fill-rule="nonzero"
                points="547.263682 2216.35015 663.349917 2216.35015 663.349917 1883.03923 970.149254 1883.03923 970.149254 1778.87956 663.349917 1778.87956 663.349917 1441.40225 547.263682 1441.40225 547.263682 1778.87956 240.464345 1778.87956 240.464345 1883.03923 547.263682 1883.03923" />
              <polygon
                fill-rule="nonzero"
                points="1836.65008 1012.26444 1952.73632 1012.26444 1952.73632 678.953513 2263.68159 678.953513 2263.68159 578.960235 1952.73632 578.960235 1952.73632 241.482924 1836.65008 241.482924 1836.65008 578.960235 1529.85075 578.960235 1529.85075 678.953513 1836.65008 678.953513" />
              <polygon
                fill-rule="nonzero"
                points="1202.32172 2478.8325 1301.82421 2478.8325 1301.82421 2241.34847 1513.267 2241.34847 1513.267 2153.85435 1301.82421 2153.85435 1301.82421 1916.37032 1202.32172 1916.37032 1202.32172 2153.85435 995.024876 2153.85435 995.024876 2241.34847 1202.32172 2241.34847" />
              <polygon
                fill-rule="nonzero"
                points="551.409619 1012.26444 659.20398 1012.26444 659.20398 674.787126 970.149254 674.787126 970.149254 578.960235 659.20398 578.960235 659.20398 241.482924 551.409619 241.482924 551.409619 578.960235 240.464345 578.960235 240.464345 674.787126 551.409619 674.787126" />
              <polygon
                fill-rule="nonzero"
                points="2189.05473 1512.23082 2288.55721 1512.23082 2288.55721 1278.91318 2500 1278.91318 2500 1187.25267 2288.55721 1187.25267 2288.55721 953.935025 2189.05473 953.935025 2189.05473 1187.25267 1981.75788 1187.25267 1981.75788 1278.91318 2189.05473 1278.91318" />
              <polygon
                points="1836.65008 2216.35015 1952.73632 2216.35015 1952.73632 1883.03923 2263.68159 1883.03923 2263.68159 1778.87956 1952.73632 1778.87956 1952.73632 1441.40225 1836.65008 1441.40225 1836.65008 1778.87956 1529.85075 1778.87956 1529.85075 1883.03923 1836.65008 1883.03923" />
              <path
                d="M1497 300v-71h-207.2V0h-74.6v229H1008v71h207.2v229h74.6V300H1497ZM207.2 1496h74.6v-229.2H489V1196H281.8V971h-74.6v225H0v75l207.2-4.2V1496Z"
                fill-rule="nonzero" />
            </g>
          </svg>
          Tableau
        </div>
        <div
          class="start-item"
          :class="{ 'start-item-active': activeExample === 'CoinMarketCap' }"
          @click="activeExample = 'CoinMarketCap'">
          <svg
            height="586"
            viewBox="0 0 577.5 586"
            width="577.5"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M502 350.2a31 31 0 0 1-31.5 2.1c-11.6-6.6-17.9-22-17.9-42.9v-64.3c0-30.9-12.2-52.8-32.7-58.8-34.5-10.1-60.3 32.2-70.2 48.1l-61.1 98.9V212.6c-.7-27.8-9.7-44.5-26.9-49.5-11.3-3.3-28.3-2-44.8 23.2L80.3 405.6A240 240 0 0 1 52.8 293c0-132.2 105.6-239.7 235.8-239.7 130.2 0 236.1 107.5 236.1 239.7v1.4c1.3 25.5-7 45.9-22.7 55.8Zm75.5-57.2v-1.3C576.4 130.7 447.2 0 288.6 0 130 0 0 131.4 0 293s129.4 293 288.6 293c73 0 143.2-28 196.2-78.2a26.9 26.9 0 0 0 1.4-37.7 26 26 0 0 0-36.6-1.8l-.1.1a233.4 233.4 0 0 1-336.3-15.7L236.1 255v91.2c0 43.8 17 58 31.2 62.2 14.2 4.2 36.1 1.3 58.9-35.8l68-110c2.1-3.5 4.1-6.6 6-9.2v55.9c0 41 16.4 73.7 45.3 89.9a83 83 0 0 0 84.6-3.4c31.7-20.6 49-57.9 47.2-102.8h.2Z"
              fill="currentColor"
              fill-rule="nonzero" />
          </svg>
          CoinMarketCap
        </div>
        <div class="start-item"></div>
      </div>
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
          <i
            class="start-item-color"
            :class="`start-item-color-${themeId}`"></i>
          {{ themeId.toLocaleLowerCase() }}
        </div>
        <!-- <p class="start-item-copy">
          Add your own typography & color palettes, or use some of our prebuilt
          themes!
        </p> -->
      </div>
    </div>
    <p class="start-h3">Features</p>
    <ul class="start-ul">
      <li>
        Add typography & color palettes, or use some of our prebuilt themes!
      </li>
      <li>A deeply integrated Rest API Client (Also Free & Open-Source)</li>
      <li>Fully integrated Search (Using fuse.js)</li>
      <li>Free hosting with an https://apidocumentation.com subdomain</li>
      <li>Support for OpenAPI 3.1, OpenAPI 3.0, and Swagger 2.0</li>
      <li>Code samples to show off your API in most popular languages</li>
    </ul>
  </div>
</template>
<style scoped>
.start {
  padding: 60px 12px 24px 24px;
  display: flex;
  flex-flow: wrap;
  justify-content: space-between;
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
}
.start-h3 {
  font-size: var(--theme-heading-4, var(--default-theme-heading-4));
  margin-top: 12px;
  line-height: 1.45;
  margin-bottom: 0;
  font-weight: var(--theme-bold, var(--default-theme-bold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
}
.start-h1:not(:first-of-type) {
  margin-top: 24px;
}
.start-p {
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.5;
  width: 100%;
  margin-top: 12px;
}
.start-ul {
  margin-top: 12px;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.5;
  padding-left: 24px;
  list-style: initial;
}
.start-ul li {
  margin: 6px 0;
  color: var(--theme-color-1, var(--default-theme-color-1));
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
.start-h2 + .start-item {
  border-radius: 0 0 0 var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.start-item:nth-of-type(5) {
  border-radius: 0 0 var(--theme-radius-lg, var(--default-theme-radius-lg)) 0;
}
.start-item {
  padding: 9px;
  display: flex;
  align-items: center;
  user-select: none;
  cursor: pointer;
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  width: 25%;
  text-transform: capitalize;
}
.start-section-colors .start-item {
  width: 20%;
}
.start-item:not(:last-of-type) {
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
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
.neato-grid {
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-top: 12px;
  gap: 12px;
  flex-flow: wrap;
}
.start-item-color {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin-right: 6px;
  border-radius: 50%;
  height: 13px;
  width: 13px;
  display: block;
}
.start-item-color-moon {
  background: #cdc9b3;
}
.dark-mode .start-item-color-moon {
  background: #646664;
}
.start-item-color-solarized {
  background: #fdf6e3;
}
.dark-mode .start-item-color-solarized {
  background: #004156;
}
.start-item-color-purple {
  background: #f5f6fd;
}
.dark-mode .start-item-color-purple {
  background: #4d547f;
}
.start-item-color-alternate {
  background: #f6f6f6;
}
.dark-mode .start-item-color-alternate {
  background: #4a4a4a;
}
.start-item-color-default {
  background: #fff;
}
.dark-mode .start-item-color-default {
  background: #343434;
}
.start-section-color .start-item {
  text-transform: capitalize;
}
.start-cta {
  width: 100%;
  margin-top: 12px;
}
.start-a {
  color: var(
    --theme-color-accent,
    var(--default-theme-color-accent)
  ) !important;
}
.start-a:hover {
  text-decoration: underline;
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
@media screen and (max-width: 600px) {
  .start-row {
    display: block;
    border: none;
    overflow: visible;
  }
  .start-section {
    width: 100%;
    border: 1px solid
      var(--theme-border-color, var(--default-theme-border-color));
    border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
    margin-bottom: 12px;
  }
  .start-item:empty {
    display: none;
  }
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
</style>
