import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Turbo already runs packages in parallel on the shared CI runner.
    // Avoid competing parser imports pushing individual tests past their timeout.
    fileParallelism: false,
  },
})
