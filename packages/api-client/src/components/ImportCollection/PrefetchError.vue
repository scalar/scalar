<script setup lang="ts">
import { isUrl } from '@/libs'

defineProps<{
  url?: string | null
}>()
</script>

<template>
  <div class="w-full text-center text-sm font-medium break-words">
    We couldn't find an OpenAPI document at the provided URL. Please download
    and import the
    <a
      v-if="url && isUrl(url)"
      :href="url"
      rel="noopener nofollow"
      target="_blank"
      v-text="'OpenAPI document manually'" />
    <span
      v-else
      v-text="'OpenAPI document manually'" />.
  </div>
</template>
