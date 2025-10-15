<script setup lang="ts">
export type Routes = (typeof routes)[number]['id']

defineProps<{
  selectedTab: Routes
}>()

const emit = defineEmits<{
  (e: 'update:selectedTab', value: Routes): void
}>()

const routes = [
  {
    name: 'Overview',
    id: 'overview',
  },
  {
    name: 'Servers',
    id: 'servers',
  },
  {
    name: 'Authentication',
    id: 'authentication',
  },
  {
    name: 'Environment',
    id: 'environment',
  },
  {
    name: 'Settings',
    id: 'settings',
  },
] as const
</script>

<template>
  <div class="flex w-full gap-2 border-b pl-1.5 md:ml-1.5 md:pl-0">
    <div
      v-for="{ name, id } in routes"
      :key="id"
      class="-ml-2 flex h-10 cursor-pointer items-center px-2 text-center text-sm font-medium whitespace-nowrap no-underline -outline-offset-1 has-[:focus-visible]:outline"
      @click="emit('update:selectedTab', id)">
      <span
        class="flex-center h-full w-full border-b"
        :class="
          selectedTab === id
            ? 'text-c-1 border-c-1'
            : 'text-c-2 hover:text-c-1 border-transparent'
        ">
        {{ name }}
      </span>
    </div>
  </div>
</template>
