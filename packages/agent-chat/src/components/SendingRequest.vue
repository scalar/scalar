<template>
  <div class="sendingRequest">
    <div class="playIcon">
      <svg
        fill="currentColor"
        height="32"
        viewBox="0 0 256 256"
        width="32"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"></path>
      </svg>
    </div>
    Sending Request to Endpoint
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
  border-width: 1.75px;
  border-style: solid;
  border-color: currentcolor currentcolor transparent;
  border-image: initial;
  border-radius: 50%;
  background: var(--scalar-background-1);
  animation: 0.42s linear 0s infinite normal none running rotation;
}

.sendingRequest {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--scalar-color-blue);
  font-weight: var(--scalar-semibold);
  min-height: 40px;
  font-size: var(--scalar-font-size-3);
  position: relative;
}

.sendingRequest svg {
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
