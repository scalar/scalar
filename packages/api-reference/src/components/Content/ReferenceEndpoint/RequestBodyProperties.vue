<script setup lang="ts">
import { ref } from 'vue'

import type { ContentProperties } from '../../../types'
import RequestBodyPropertiesChild from './RequestBodyPropertiesChild.vue'

defineProps<{ contentProperties: ContentProperties; required: string[] }>()

const open = ref(true)
</script>
<template>
  <li
    v-for="name in Object.keys(contentProperties || {})"
    :key="contentProperties[name].type">
    <span class="parameter-name">{{ name }}</span>
    <span
      class="parameter-required"
      :class="required?.includes(name) ? 'parameter__required' : ''">
      {{ required?.includes(name) ? 'required' : 'optional' }}
    </span>
    <span class="parameter-type">{{ contentProperties[name].type }}</span>
    <p
      v-if="contentProperties[name].description"
      class="parameter-description">
      {{ contentProperties[name].description }}
    </p>
    <div
      v-if="Object.keys(contentProperties[name].properties || {}).length > 0"
      class="parameter-child"
      :class="{ 'parameter-child__open': open }">
      <div
        class="parameter-child-trigger"
        @click="open = !open">
        <svg
          fill="currentColor"
          height="14"
          viewBox="0 0 14 14"
          width="14"
          xmlns="http://www.w3.org/2000/svg">
          <polygon
            fill-rule="nonzero"
            points="14 8 8 8 8 14 6 14 6 8 0 8 0 6 6 6 6 0 8 0 8 6 14 6" />
        </svg>
        <span>Child Attributes</span>
      </div>
      <ul
        v-show="open"
        class="parameter">
        <RequestBodyPropertiesChild
          :contentProperties="contentProperties[name].properties || {}" />
      </ul>
    </div>
  </li>
</template>
