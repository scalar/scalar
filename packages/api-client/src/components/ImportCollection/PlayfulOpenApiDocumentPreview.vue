<script lang="ts" setup>
import type { REQUEST_METHODS } from '@scalar/oas-utils/helpers'

import OperationBadge from './OperationBadge.vue'

const items: {
  method: keyof typeof REQUEST_METHODS
  name: string
}[] = [
  {
    method: 'post',
    name: 'Create a user',
  },
  {
    method: 'patch',
    name: 'Update a user',
  },
  {
    method: 'delete',
    name: 'Delete a user',
  },
  {
    method: 'get',
    name: 'Retrieve a user',
  },
  {
    method: 'get',
    name: 'List all users',
  },
  {
    method: 'put',
    name: 'Replace a user',
  },
  {
    method: 'head',
    name: 'Check user existence',
  },
  {
    method: 'options',
    name: 'Get user options',
  },
]
</script>

<template>
  <div class="flex flex-col gap-2 overflow-hidden">
    <!-- Row 1: Scroll left -->
    <div class="flex gap-2 animate-scroll-left">
      <template
        v-for="({ method, name }, index) in items"
        :key="`row3-${index}`">
        <OperationBadge
          :method="method"
          :name="name" />
      </template>
    </div>

    <!-- Row 2: Scroll right -->
    <div class="flex gap-2 animate-scroll-right">
      <template
        v-for="({ method, name }, index) in items"
        :key="`row2-${index}`">
        <OperationBadge
          :method="method"
          :name="name" />
      </template>
    </div>

    <!-- Row 3: Scroll left -->
    <div class="flex gap-2 animate-scroll-left">
      <template
        v-for="({ method, name }, index) in items"
        :key="`row3-${index}`">
        <OperationBadge
          :method="method"
          :name="name" />
      </template>
    </div>
  </div>
</template>

<style>
@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes scroll-right {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

.animate-scroll-left {
  animation: scroll-left 120s linear infinite;
}

.animate-scroll-right {
  animation: scroll-right 120s linear infinite;
}
</style>
