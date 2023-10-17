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

.references-narrow .section-columns {
  flex-direction: column;
  gap: 24px;
}
</style>
