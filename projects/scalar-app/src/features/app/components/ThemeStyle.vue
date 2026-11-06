<script setup lang="ts">
import { escapeCssForStyleTag } from '@scalar/helpers/dom/escape-css-for-style-tag'
import { computed } from 'vue'

const { css, slug } = defineProps<{
  /** The resolved theme CSS */
  css: string
  /** The slug of the active theme */
  slug: string
}>()

/**
 * Custom themes come from the themes API, so the CSS is set as text content and
 * never parsed as HTML. It is escaped as well, so a closing style tag stays
 * inside this element when the markup is serialized, for example in tests.
 */
const content = computed(() => escapeCssForStyleTag(css))
</script>

<template>
  <!-- Vue templates cannot contain a literal style tag, so render it dynamically -->
  <!-- eslint-disable vue/no-v-text-v-html-on-component -->
  <component
    :is="'style'"
    id="scalar-theme"
    :data-testid="slug"
    v-text="content" />
  <!-- eslint-enable vue/no-v-text-v-html-on-component -->
</template>
