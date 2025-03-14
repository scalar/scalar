<script lang="ts">
/**
 * Scalar Form Section component
 *
 * A collection of form fields grouped together with a title.
 *
 * @example
 *   <ScalarFormSection>
 *     <template #label>Section Label</template>
 *     <!-- Section content -->
 *   </ScalarFormSection>
 */
export default {}
</script>
<template>
  <fieldset class="flex min-w-0 flex-col gap-4">
    <!-- Legend and flexbox have some issues -->
    <legend class="contents">
      <span class="text-lg font-medium text-c-1">
        <slot name="label" />
      </span>
    </legend>
    <slot />
  </fieldset>
</template>
