import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Same aliases as vite.config.ts: the tests exercise the studio against the
// real core package sources (`@/bot/*` -> packages/avatar-core/src/bot/*).
// The Vue plugin exists for `ui/capture.test.ts`, which mounts TheOwlOpsBot.vue.
const coreBot = fileURLToPath(new URL('../../packages/avatar-core/src/bot', import.meta.url))
const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^@\/bot(?=\/|$)/, replacement: coreBot },
      { find: /^@(?=\/|$)/, replacement: src }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
