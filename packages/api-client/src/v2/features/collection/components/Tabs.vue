<script setup lang="ts">
import { capitalize, computed } from 'vue'
import { RouterLink } from 'vue-router'

const { type } = defineProps<{
  type: 'document' | 'workspace'
}>()

/** Different routes for workspace vs document */
const routes = computed(() =>
  type === 'workspace'
    ? ['overview', 'environment', 'cookies', 'settings']
    : [
        'overview',
        'servers',
        'authentication',
        'environment',
        'cookies',
        'settings',
      ],
)
</script>

<template>
  <div class="flex w-full gap-2 border-b pl-1.5 md:ml-1.5 md:pl-0">
    <RouterLink
      v-for="route in routes"
      :key="route"
      v-slot="{ isActive, href, navigate }"
      custom
      :to="{ name: `${type}.${route}` }">
      <a
        class="-ml-2 flex h-10 cursor-pointer items-center px-2 text-center text-sm font-medium whitespace-nowrap no-underline -outline-offset-1 has-[:focus-visible]:outline"
        :href="href"
        @click="navigate">
        <span
          class="flex-center hover:text-c-1 h-full border-b"
          :class="
            isActive
              ? 'text-c-1 border-c-1'
              : 'text-c-2 hover:text-c-1 border-transparent'
          ">
          {{ capitalize(route) }}
        </span>
      </a>
    </RouterLink>
  </div>
</template>
