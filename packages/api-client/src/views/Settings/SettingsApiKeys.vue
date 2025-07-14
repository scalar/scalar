<template>
  <div class="w-full px-6 py-6">
    <div class="mb-6">
      <h2 class="text-c-1 mb-2 text-lg font-semibold">Pro API Keys</h2>
      <p class="text-c-2 mb-4 text-sm">
        Configure API keys for premium services that require authentication via
        path injection. Supported services: DefLlama Pro, CoinGecko Pro,
        CoinMarketCap Pro, and Llama Pro.
      </p>
    </div>

    <ApiKeyManager />

    <div class="bg-c-2 mt-6 rounded-lg p-4">
      <h3 class="text-c-1 mb-2 text-sm font-medium">How it works</h3>
      <ul class="text-c-2 space-y-1 text-xs">
        <li>• API keys are stored locally in your browser</li>
        <li>
          • Keys are automatically injected into URLs for supported services
        </li>
        <li>
          • Format:
          <code class="bg-c-3 rounded px-1 font-mono"
            >https://pro-api.service.com/{your-key}/endpoint</code
          >
        </li>
        <li>• Each workspace has its own API key configuration</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import ApiKeyManager from '@/components/ApiKeyManager.vue'
</script>
