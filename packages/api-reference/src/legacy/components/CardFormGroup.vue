<template>
  <div class="card-form-group">
    <slot />
  </div>
</template>
<style scoped>
.card-form-group {
  display: flex;
}
.card-form-group + .card-form-group {
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
</style>
