<script setup lang="ts">
import { type ThemeId } from '@scalar/themes'
import { ref, watch } from 'vue'

import { type GettingStartedExamples } from '../../types'

defineProps<{
  theme: ThemeId
}>()

const emits = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'openEditor'): void
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
    <p class="start-p">
      Below you can quickly get started by importing your file, going through
      examples & also checking out our pre-made themes ✨
    </p>
    <div class="start-section">
      <div class="start-h2">Quick Start</div>
      <div
        class="start-item"
        @click="$emit('openEditor')">
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <g fill="currentColor">
            <path
              d="M10.5 18.4 7.7 21a2.9 2.9 0 0 1-4 0l-.8-.9a2.8 2.8 0 0 1-.8-2 2.7 2.7 0 0 1 .8-2l5.8-5.8a2.8 2.8 0 0 1 4 0l.8 1A1 1 0 1 0 15 10l-.9-.9a4.8 4.8 0 0 0-6.7 0L1.5 15a4.8 4.8 0 0 0 0 6.8l.9.9a4.8 4.8 0 0 0 6.7 0l2.8-2.8a1 1 0 0 0 0-1.4 1 1 0 0 0-1.4 0Z" />
            <path
              d="m22.5 2.4-.9-1a4.8 4.8 0 0 0-6.7 0l-2.9 3a1 1 0 1 0 1.4 1.4l3-3a2.8 2.8 0 0 1 3.9 0l.9 1a2.7 2.7 0 0 1 .8 2 2.8 2.8 0 0 1-.8 2l-5.8 5.8a2.8 2.8 0 0 1-2 .8 2.8 2.8 0 0 1-2-.8 1 1 0 0 0-1.4 1.3 4.8 4.8 0 0 0 3.4 1.4 4.8 4.8 0 0 0 3.4-1.4l5.8-5.8a4.8 4.8 0 0 0 0-6.7Z" />
          </g>
        </svg>
        Import URL
      </div>
      <div
        class="start-item"
        @click="$emit('openEditor')">
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <g>
            <path
              d="M24 2.2A2.21 2.21 0 0 0 21.8 0h-4.41a1.23 1.23 0 1 0 0 2.45h3.91a.25.25 0 0 1 .25.25v18.6a.25.25 0 0 1-.25.25h-3.91a1.23 1.23 0 1 0 0 2.45h4.41a2.21 2.21 0 0 0 2.2-2.2Z"
              fill="currentColor"></path>
            <path
              d="M0 2.2v19.6A2.21 2.21 0 0 0 2.2 24h4.41a1.23 1.23 0 1 0 0-2.45H2.7a.25.25 0 0 1-.25-.25V2.7a.25.25 0 0 1 .25-.25h3.91a1.23 1.23 0 1 0 0-2.45H2.2A2.21 2.21 0 0 0 0 2.2Z"
              fill="currentColor"></path>
            <path
              d="M16.9 13a1 1 0 0 0 .74-1.62l-4.9-5.64a1 1 0 0 0-1.48 0l-4.9 5.64A1 1 0 0 0 7.1 13h3.18a.25.25 0 0 1 .25.25v5.49a1.47 1.47 0 0 0 2.94 0v-5.51a.25.25 0 0 1 .25-.25Z"
              fill="currentColor"></path>
          </g>
        </svg>
        Upload Swagger File
      </div>
      <div
        class="start-item"
        @click="$emit('openEditor')">
        <svg
          viewBox="0 0 12 16"
          width="10"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 5h4c1.7 0 2-1.3 2-3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2 0 1.7.3 3 2 3Zm0-3V1c0-.6.5-1 1-1h2c.5 0 1 .4 1 1v1.3c0 .6-.4.7-1 .7H5a1 1 0 0 1-1-1Z"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg" />
        </svg>
        Paste in Swagger Editor
      </div>
      <div
        class="start-item"
        @click="$emit('openEditor')">
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <g>
            <path
              d="M22.13 9.48c.52-1.06 2.21-5.1-.85-7.62a.54.54 0 0 0-.28-.11c-1.91 0-4.45 2.45-5.22 3.25A14.55 14.55 0 0 0 8.3 5C7.51 4.19 5 1.75 3.08 1.75a.51.51 0 0 0-.31.11C.12 4 .92 7.52 1.89 9.44a9.47 9.47 0 0 0-1.32 5.81c.26 3.31 3 7 6.49 7h9.88c3.51 0 6.23-3.69 6.48-7a9.32 9.32 0 0 0-1.29-5.77ZM16 19.75H8a3.5 3.5 0 0 1-3.5-3.5c0-5.91 4.12-3.53 7.5-3.53s7.5-2.44 7.5 3.53a3.5 3.5 0 0 1-3.5 3.5Z"
              fill="currentColor"></path>
            <path
              d="M14.52 16.25a1 1.5 0 1 0 2 0 1 1.5 0 1 0-2 0"
              fill="currentColor"></path>
            <path
              d="M7.52 16.25a1 1.5 0 1 0 2 0 1 1.5 0 1 0-2 0"
              fill="currentColor"></path>
          </g>
        </svg>
        Integrate via GitHub
      </div>
    </div>
    <div class="start-section">
      <div class="start-h2">Swagger Editor Examples</div>
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
    </div>
    <div class="start-section">
      <div class="start-h2">Integrations - Self Hosted</div>
      <div class="swagger-editor-integrations">
        <a
          class="start-link-item"
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
          class="start-link-item"
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
          class="start-link-item"
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
          class="start-link-item"
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
        <div class="start-link-item">
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
        </div>
      </div>
    </div>
    <div class="start-section start-section-color">
      <div class="start-h2">Fully Themeable</div>
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
    </div>
    <p class="start-h1">Features</p>
    <ul class="start-ul">
      <li>A deeply integrated Rest API Client (Also Free & Open-Source)</li>
      <li>Fully integrated Search (Using fuse.js)</li>
      <li>
        All CSS variables are editable so you can easily add your own typography
        & color palettes.
      </li>
      <li>Free hosting with an https://apidocumentation.com subdomain</li>
      <li>
        Integrations with Vue.js, React, a CDN, Fastify and soon to be many more
      </li>
      <li>Support for OpenAPI 3.1, OpenAPI 3.0, and Swagger 2.0</li>
      <li>Code samples to show off your API in most popular languages</li>
    </ul>
  </div>
</template>
<style scoped>
.start {
  padding: 30px 18px 24px 30px;
  display: flex;
  flex-flow: wrap;
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
.start-h1:not(:first-of-type) {
  margin-top: 24px;
}
.start-p {
  margin-top: 12px;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.5;
}
.start-ul {
  margin-top: 6px;
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
.start-section {
  padding: 24px 0 0;
  width: 50%;
  min-width: 180px;
}
.start-h2 {
  padding-bottom: 9px;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-font-semibold, var(--default-theme-semibold));
}
.swagger-editor-integrations {
  width: 100%;
  position: relative;
  user-select: none;
}
.start-link-item {
  display: flex;
  align-items: center;
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  display: flex;
  width: 100%;
  cursor: pointer;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  margin-bottom: 2px;
  /* background: var(--theme-background-2, var(--default-theme-background-2)); */
  color: var(--theme-color-2, var(--default-theme-color-2));
  z-index: 10;
  text-decoration: none;
  height: 30px;
  padding: 0 9px;
}
.start-link-item:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.start-link-item svg {
  height: 14px;
  width: 14px;
  margin-right: 6px;
}
.start-item-table {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  padding: 2px;
}
.start-item-table .start-item:nth-of-type(1) {
  border-top: none;
}
.start-item {
  padding: 0 9px;
  height: 30px;
  display: flex;
  align-items: center;
  margin-bottom: 1px;
  user-select: none;
  cursor: pointer;
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  border-radius: var(--theme-radius, var(--default-theme-radius));
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
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
}
.start-item-active:hover {
  background: transparent;
}
.start-item-color {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin-right: 6px;
  border-radius: 50%;
  height: 13px;
  width: 13px;
}
.start-item-color-moon {
  background: #cdc9b3;
}
.dark-mode .start-item-color-moon {
  background: #323332;
}
.start-item-color-solarized {
  background: #fdf6e3;
}
.dark-mode .start-item-color-solarized {
  background: #00212b;
}
.start-item-color-purple {
  background: #f5f6fd;
}
.dark-mode .start-item-color-purple {
  background: #262a40;
}
.start-item-color-alternate {
  background: #f6f6f6;
}
.dark-mode .start-item-color-alternate {
  background: #252525;
}
.start-item-color-default {
  background: #fff;
}
.dark-mode .start-item-color-default {
  background: #1a1a1a;
}
.start-section-color .start-item {
  text-transform: capitalize;
}
</style>
