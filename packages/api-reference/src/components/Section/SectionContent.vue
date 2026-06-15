<template>
  <div class="section-content">
    <slot />
  </div>
</template>

<style scoped>
@container narrow-references-container (max-width: 900px) {
  .section-content--with-columns {
    flex-direction: column;
    gap: 24px;
  }
}
</style>
