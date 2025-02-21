<script setup lang="ts">
import Keycap from '@/assets/keycap.ascii?raw'

import ScalarAsciiArt from './ScalarAsciiArt.vue'
import ScalarHotkey from './ScalarHotkey.vue'
</script>
<template>
  <div class="scale-75 flex flex-center w-full">
    <div class="relative">
      <ScalarHotkey
        class="keycap-hotkey border-transparent right-14 text-xl"
        hotkey="" />
      <ScalarAsciiArt
        :art="Keycap"
        class="!leading-[6px] text-c-3" />
    </div>
    <div class="relative -ml-12">
      <div class="keycap-hotkey right-16 text-xl">K</div>
      <ScalarAsciiArt
        :art="Keycap"
        class="!leading-[6px] keycap-n" />
    </div>
  </div>
</template>
<style scoped>
.keycap-n {
  background: -webkit-linear-gradient(
    5deg,
    transparent 30%,
    var(--scalar-color-3) 50%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.keycap-hotkey {
  position: absolute;
  top: 32px;
  line-height: 26px;
}
</style>
