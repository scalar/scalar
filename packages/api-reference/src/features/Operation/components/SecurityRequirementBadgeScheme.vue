<script setup lang="ts">
import type { Component } from 'vue'

import type { RequiredSecurityScheme } from '@/features/Operation/helpers/get-required-security'

const { is = 'li', scheme } = defineProps<{
  is?: Component | string
  scheme: RequiredSecurityScheme
}>()
</script>
<template>
  <component
    :is
    class="markdown">
    <!-- Strike through the scheme name when the scheme is deprecated (OpenAPI 3.2) -->
    <span :class="{ 'scheme-deprecated': scheme.scheme?.deprecated }">
      {{ scheme.name }}
    </span>
    <code v-if="scheme.scheme?.type">{{ scheme.scheme.type }}</code>
    <ul v-if="scheme.scopes.length">
      <li
        v-for="scope in scheme.scopes"
        :key="scope"
        class="font-code text-c-2">
        {{ scope }}
      </li>
    </ul>
  </component>
</template>

<style scoped>
.scheme-deprecated {
  text-decoration: line-through;
}
</style>
