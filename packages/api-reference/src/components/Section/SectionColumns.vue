<template>
  <div class="section-columns">
    <slot />
  </div>
</template>

<style scoped>
.section-columns {
  display: flex;
  gap: 48px;
}
@container references-container (max-width: 900px) {
  .section-columns {
    flex-direction: column;
    gap: 24px;
  }
}
</style>
