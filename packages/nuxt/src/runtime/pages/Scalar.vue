<script lang="ts" setup>
const { meta } = useRoute()

// Ensure we have a spec
if (
  !meta.isOpenApiEnabled &&
  !meta.configuration?.spec?.url &&
  !meta.configuration?.spec?.content
)
  throw new Error(
    'You must either provide a spec to scalarConfig, or enable experimental openApi in the Nitro config.',
  )
</script>

<template>
  <ScalarApiReference :configuration="meta.configuration" />
</template>
