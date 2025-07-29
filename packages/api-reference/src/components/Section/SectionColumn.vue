<template>
  <div class="section-column"><slot /></div>
</template>

<style scoped>
@reference "tailwindcss";

.section-column {
  @apply text-lg;

  flex: 1;
  min-width: 0;
}
@container narrow-references-container (max-width: 900px) {
  .section-column:nth-of-type(2) {
    padding-top: 0;
  }
}
</style>
