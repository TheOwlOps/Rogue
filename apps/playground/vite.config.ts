import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The playground is a client of the avatar core package, exactly like any
// chat app would be: `@/bot/*` resolves into
// `packages/avatar-core/src/bot/*`, so the studio and the SDK can never
// drift apart — there is only one engine.
const coreBot = fileURLToPath(new URL('../../packages/avatar-core/src/bot', import.meta.url))
const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { port: 5190 },
  resolve: {
    alias: [
      { find: /^@\/bot(?=\/|$)/, replacement: coreBot },
      { find: /^@(?=\/|$)/, replacement: src }
    ]
  }
})
