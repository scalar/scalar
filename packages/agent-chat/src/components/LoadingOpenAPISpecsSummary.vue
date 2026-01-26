<template>
  <div class="loadingApiSpecs">
    <div class="playIcon"></div>
    Loading APIs...
  </div>
</template>

<style scoped>
.playIcon {
  padding: 4px;
  height: 16px;
  width: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--scalar-background-1);
  border-radius: 50%;
}

.playIcon::before {
  content: '';
  width: 16px;
  height: 16px;
  display: inline-block;
  box-sizing: border-box;
  position: absolute;
  border-width: 1.5px;
  border-style: solid;
  border-color: currentcolor currentcolor transparent;
  border-image: initial;
  border-radius: 50%;
  background: var(--scalar-background-1);
  animation: 0.42s linear 0s infinite normal none running rotation;
}

.loadingApiSpecs {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
  margin-bottom: 10px;
}

.loadingApiSpecs svg {
  width: 100%;
  height: 100%;
  z-index: 1;
  border-radius: 50%;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
