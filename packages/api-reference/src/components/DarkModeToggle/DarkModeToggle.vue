<script lang="ts" setup>
defineProps<{
  isDarkMode: boolean
}>()

defineEmits<{
  (e: 'toggleDarkMode'): void
}>()
</script>
<template>
  <div class="darklight-reference-switch">
    <a
      class="darklight-reference-promo"
      href="https://www.scalar.com"
      target="_blank">
      powered by scalar
    </a>
    <button
      class="darklight"
      :class="{ darklight_dark: isDarkMode }"
      type="button"
      @click="$emit('toggleDarkMode')">
      <div class="darklight-slider">
        <div class="toggleicon">
          <i class="toggleicon-sunray"></i>
          <i class="toggleicon-sunray"></i>
          <i class="toggleicon-sunray"></i>
          <i class="toggleicon-sunray"></i>
          <i class="toggleicon-sun"></i>
        </div>
      </div>
    </button>
  </div>
</template>
<style scoped>
.darklight-reference-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.darklight-reference-promo {
  display: flex;
  align-items: center;
  font-size: var(--scalar-mini);
  text-decoration: none;
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
}
.darklight-reference-promo:hover {
  text-decoration: underline;
}
.darklight {
  height: 12px;
  width: 36px;
  border-radius: 12px;
  background: var(--scalar-border-color);
  display: flex;
  align-items: center;
  cursor: pointer;
  appearance: none;
  border: none;
  padding: 0;
  outline: none;
}
.toggleicon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;
}
.darklight-slider {
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--scalar-background-1);
  position: absolute;
  transition: transform 0.3s ease-in-out;
  filter: brightness(var(--scalar-lifted-brightness));
}
.toggleicon-sun {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--scalar-color-1);
  overflow: hidden;
  position: relative;
  background: var(--scalar-background-1);
  display: inline-block;
  transition:
    width 0.3s ease-in-out,
    height 0.3s ease-in-out;
}
.toggleicon-sun:before {
  content: '';
  width: 100%;
  height: 100%;
  border: 1px solid var(--scalar-color-1);
  display: block;
  left: 2.5px;
  bottom: 2.5px;
  position: absolute;
  border-radius: 50%;
  background: var(--scalar-background-1);
  transition: transform 0.3s ease-in-out;
  transform: translate3d(4px, -4px, 0);
}
.toggleicon-sunray {
  width: 12px;
  height: 1px;
  border-radius: 8px;
  background: var(--scalar-color-1);
  position: absolute;
  transition: transform 0.3s ease-in-out;
}
.toggleicon-sunray:nth-of-type(2) {
  transform: rotate(90deg);
}
.toggleicon-sunray:nth-of-type(3) {
  transform: rotate(45deg);
}
.toggleicon-sunray:nth-of-type(4) {
  transform: rotate(-45deg);
}
.darklight_dark .toggleicon-sunray {
  transform: scale(0);
}
.darklight_dark .toggleicon-sun:before {
  transform: translate3d(0, 0, 0);
}
.darklight_dark .toggleicon-sun {
  width: 10px;
  height: 10px;
  mask-image: radial-gradient(
    circle at bottom left,
    pink 10px,
    transparent 12px
  );
}
.darklight_dark .darklight-slider {
  transform: translate3d(14px, 0, 0);
}
</style>
