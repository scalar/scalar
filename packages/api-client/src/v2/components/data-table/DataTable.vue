<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineProps<{
  columns: (string | undefined)[]
  /** Scroll horizontally */
  scroll?: boolean
  /** Presentational table */
  presentational?: boolean
}>()
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        scroll ? 'overflow-x-auto custom-scroll' : 'overflow-visible',
        'scalar-data-table',
      )
    ">
    <table
      class="mb-0 grid min-h-8 auto-rows-auto"
      :class="{ 'w-max min-w-full': scroll }"
      :role="presentational ? 'presentation' : 'table'"
      :style="{
        gridTemplateColumns: columns.map((col) => col || '1fr').join(' '),
      }">
      <caption
        v-if="$slots.caption"
        class="sr-only">
        <slot name="caption" />
      </caption>
      <!--
        The HTML parser inserts a `tbody` around rows that sit directly under a `table`, so the
        rows are wrapped in one here to keep server-rendered markup hydratable. `contents` keeps
        it out of the table's grid, the same way the rows lay themselves out.
      -->
      <tbody class="contents">
        <slot />
      </tbody>
    </table>
  </div>
</template>
