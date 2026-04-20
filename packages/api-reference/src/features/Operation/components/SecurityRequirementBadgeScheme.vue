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
    {{ scheme.name }}
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
