<script setup lang="ts">
import { useCssModule } from 'vue'

import { useApplyClasses } from '../hooks/useApplyClasses'

const { scrollbars } = useCssModule()

// Add the reset to the headless UI root as well if there is one
useApplyClasses('#headlessui-portal-root', scrollbars)
</script>
<template>
  <slot :styles="scrollbars" />
</template>
<style lang="postcss" module>
@layer scalar-utilities {
  .scrollbars {
    :global(.cm-scroller),
    :global(.custom-scroll) {
      overflow-y: auto;
      scrollbar-color: transparent transparent;
      scrollbar-width: thin;
      -webkit-overflow-scrolling: touch;
    }
    :global(.custom-scroll-self-contain-overflow) {
      overscroll-behavior: contain;
    }
    @supports (-moz-appearance: none) {
      :global(.cm-scroller),
      :global(.custom-scroll) {
        padding-right: 12px;
      }
    }
    :global(.cm-scroller:hover),
    :global(.custom-scroll:hover) {
      scrollbar-color: var(--scalar-scrollbar-color) transparent;
    }
    :global(.cm-scroller:hover::-webkit-scrollbar-thumb),
    :global(.custom-scroll:hover::-webkit-scrollbar-thumb) {
      background: var(--scalar-scrollbar-color);
      background-clip: content-box;
      border: 3px solid transparent;
    }
    :global(.cm-scroller::-webkit-scrollbar-thumb:active),
    :global(.custom-scroll::-webkit-scrollbar-thumb:active) {
      background: var(--scalar-scrollbar-color-active);
      background-clip: content-box;
      border: 3px solid transparent;
    }
    :global(.cm-scroller::-webkit-scrollbar-corner),
    :global(.custom-scroll::-webkit-scrollbar-corner) {
      background: transparent;
    }
    :global(.cm-scroller::-webkit-scrollbar),
    :global(.custom-scroll::-webkit-scrollbar) {
      height: 12px;
      width: 12px;
    }
    :global(.cm-scroller::-webkit-scrollbar-track),
    :global(.custom-scroll::-webkit-scrollbar-track) {
      background: transparent;
    }
    :global(.cm-scroller::-webkit-scrollbar-thumb),
    :global(.custom-scroll::-webkit-scrollbar-thumb) {
      border-radius: 20px;
      background: transparent;
      background-clip: content-box;
      border: 3px solid transparent;
    }
    @media (pointer: coarse) {
      :global(.cm-scroller),
      :global(.custom-scroll) {
        padding-right: 12px;
      }
    }
  }
}
</style>
