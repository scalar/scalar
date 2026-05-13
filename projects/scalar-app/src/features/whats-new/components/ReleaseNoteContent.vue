<script lang="ts">
/**
 * Renderer for the rich `content` array on a release note. Splits the
 * "What's new" modal markup so the modal itself stays focused on layout
 * and so the per-block rendering rules live in a single place.
 *
 * Block types are kept narrow on purpose - paragraph, heading, list,
 * image, video, and href - so the data stays easy to author by hand on the
 * release PR and the renderer stays small enough to read in one screen.
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarIconArrowSquareOut } from '@scalar/icons'

import type { ContentBlock } from '../types'

const { blocks } = defineProps<{
  blocks: ContentBlock[]
}>()
</script>

<template>
  <template
    v-for="(block, index) in blocks"
    :key="index">
    <p
      v-if="block.type === 'paragraph'"
      class="text-c-2 text-sm leading-relaxed">
      {{ block.text }}
    </p>

    <h4
      v-else-if="block.type === 'heading' && (block.level ?? 3) === 3"
      class="text-c-1 text-sm font-semibold">
      {{ block.text }}
    </h4>

    <h5
      v-else-if="block.type === 'heading'"
      class="text-c-1 text-xs font-semibold tracking-wide uppercase">
      {{ block.text }}
    </h5>

    <ol
      v-else-if="block.type === 'list' && block.ordered"
      class="text-c-2 ml-4 flex list-decimal flex-col gap-1 text-sm leading-relaxed">
      <li
        v-for="(item, itemIndex) in block.items"
        :key="itemIndex">
        {{ item }}
      </li>
    </ol>

    <ul
      v-else-if="block.type === 'list'"
      class="text-c-2 ml-4 flex list-disc flex-col gap-1 text-sm leading-relaxed">
      <li
        v-for="(item, itemIndex) in block.items"
        :key="itemIndex">
        {{ item }}
      </li>
    </ul>

    <figure
      v-else-if="block.type === 'image'"
      class="flex flex-col gap-1.5">
      <img
        :alt="block.alt"
        class="w-full rounded-md border border-(--scalar-border-color)"
        decoding="async"
        :height="block.height"
        loading="lazy"
        :src="block.src"
        :width="block.width" />
      <figcaption
        v-if="block.caption"
        class="text-c-3 text-xs">
        {{ block.caption }}
      </figcaption>
    </figure>

    <figure
      v-else-if="block.type === 'video'"
      class="flex flex-col gap-1.5">
      <video
        :autoplay="block.autoplay"
        class="w-full rounded-md border border-(--scalar-border-color)"
        :controls="block.controls !== false"
        :loop="block.loop"
        :muted="block.muted"
        playsinline
        :poster="block.poster"
        preload="metadata"
        :src="block.src"></video>
      <figcaption
        v-if="block.caption"
        class="text-c-3 text-xs">
        {{ block.caption }}
      </figcaption>
    </figure>

    <div
      v-else-if="block.type === 'href'"
      class="text-c-accent">
      <a
        class="inline-flex items-center gap-1 text-xs hover:underline"
        :href="block.href"
        rel="noopener noreferrer"
        target="_blank">
        {{ block.label }}
        <ScalarIconArrowSquareOut
          class="size-3"
          weight="bold" />
      </a>
    </div>
  </template>
</template>
