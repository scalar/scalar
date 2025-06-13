<script setup lang="ts">
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { normalizeHttpMethod } from '@scalar/helpers/http/normalize-http-method'
import type { OpenAPI } from '@scalar/openapi-types'
import { computed, type Component } from 'vue'

const props = defineProps<{
  /** The type of element to render as, defaults to `span` */
  as?: Component | string
  /** The css style property or variable that will be set to the request method color, defaults to `color` */
  property?: string
  /** Whether or not to abbreviated the slot content */
  short?: boolean
  /** The HTTP method to show */
  method: OpenAPI.HttpMethod | string
}>()

/** Grabs the method info object which contains abbreviation, color, and background color etc */
const httpMethodInfo = computed(() => getHttpMethodInfo(props.method))

/** Full method name */
const normalized = computed(() => normalizeHttpMethod(props.method))
</script>

<template>
  <component
    :is="as ?? 'span'"
    class="uppercase"
    :style="{ [property || 'color']: httpMethodInfo.colorVar }">
    <slot />
    {{ short ? httpMethodInfo.short : normalized }}
  </component>
</template>
