<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { COLOR_BY_ID, DEFAULT_COLOR, DEFAULT_SHAPE, SHAPE_BY_ID } from '@/bot/skins'
import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@/bot/expressions'
import type { Block } from '@/bot/cycles'
import type { StateId } from '@/bot/states'
import { accessoryOrNull } from '@/ui/accessories'
import TheOwlOpsBot from '@/components/TheOwlOpsBot.vue'

/**
 * The Stage: one avatar, fullscreen, alive.
 *
 * The studio is for building a look; this page is for LIVING with it. The
 * avatar drifts through calm states on its own, watches the visitor's
 * cursor while it rests (the studio component's follow), and celebrates
 * when poked. The look comes from the same `#avatar=` share link the
 * studio writes — shape, colour, face, accessory — so the link a visitor
 * copies in the Customizer opens THEIR bot here. `bg=light` flips the
 * stage to paper; anything else is the dark stage.
 *
 * No bounce, no hop — not in the ambient rotation, not in the poke
 * reactions. Those two never run unattended in this product, and a poke
 * is a celebration, not a trampoline.
 */

function readStageHash() {
  const params = new URLSearchParams(location.hash.slice(1))
  const parts = (params.get('avatar') ?? '').split('.')
  const valid =
    (parts.length === 3 || parts.length === 4) &&
    SHAPE_BY_ID.has(parts[0]!) &&
    COLOR_BY_ID.has(parts[1]!) &&
    EXPRESSION_BY_ID.has(parts[2]!) &&
    (parts.length === 3 || accessoryOrNull(parts[3]!) !== null)
  return {
    shape: valid ? parts[0]! : DEFAULT_SHAPE,
    color: valid ? parts[1]! : DEFAULT_COLOR,
    expression: valid ? parts[2]! : DEFAULT_EXPRESSION,
    accessory: valid && parts.length === 4 ? parts[3]! : 'none',
    dark: params.get('bg') !== 'light',
    described: valid
  }
}

const cfg = readStageHash()
const dark = ref(cfg.dark)
const paper = computed(() => (dark.value ? '#0b0b10' : '#f9f9f9'))

/** Calm states the stage drifts through; idle dominates, as it should. */
const ROTATION: StateId[] = ['idle', 'wave', 'idle', 'heart', 'idle', 'sonar', 'idle', 'halo']
/** Poke reactions: user-triggered one-shots, then back to the rotation. */
const POKES: StateId[] = ['burst', 'sparkle', 'laugh', 'dance', 'fireworks']

const state = ref<StateId>('idle')
const block = ref(0)
const elapsed = ref(0)
const playing = ref(true)
/** One long block: the stage drives states itself, the montage stays out. */
const cycle: Block[] = [{ state: 'idle', duration: 3600 }]

const size = ref(480)
function fit() {
  size.value = Math.max(240, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.78))
}

let rotationStep = 0
let rotateTimer = 0
let pokeTimer = 0
let poking = false

function rotate() {
  if (!poking) {
    rotationStep = (rotationStep + 1) % ROTATION.length
    state.value = ROTATION[rotationStep]!
  }
  rotateTimer = window.setTimeout(rotate, 7000)
}

function poke() {
  poking = true
  state.value = POKES[Math.floor(Math.random() * POKES.length)]!
  clearTimeout(pokeTimer)
  pokeTimer = window.setTimeout(() => {
    poking = false
    state.value = ROTATION[rotationStep]!
  }, 1700)
}

const hintVisible = ref(true)
let hintTimer = 0

const studioHref = computed(
  () =>
    `index.html#avatar=${cfg.shape}.${cfg.color}.${cfg.expression}.${cfg.accessory}`
)

function toggleBg() {
  dark.value = !dark.value
  const params = new URLSearchParams(location.hash.slice(1))
  params.set('bg', dark.value ? 'dark' : 'light')
  history.replaceState(null, '', `#${params.toString()}`)
}

onMounted(() => {
  fit()
  window.addEventListener('resize', fit)
  rotateTimer = window.setTimeout(rotate, 7000)
  hintTimer = window.setTimeout(() => (hintVisible.value = false), 7000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fit)
  clearTimeout(rotateTimer)
  clearTimeout(pokeTimer)
  clearTimeout(hintTimer)
})
</script>

<template>
  <main
    class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden transition-colors duration-500"
    :style="{
      background: dark
        ? 'radial-gradient(60% 50% at 50% 42%, #1a1a26 0%, #0b0b10 70%)'
        : 'radial-gradient(60% 50% at 50% 42%, #ffffff 0%, #f1f1ee 70%)'
    }"
  >
    <a
      :href="studioHref"
      class="absolute left-5 top-5 text-sm underline-offset-4 transition hover:underline"
      :style="{ color: dark ? '#9d9dab' : '#6d6d66' }"
    >
      ← Make yours in the studio
    </a>
    <button
      type="button"
      class="absolute right-5 top-5 cursor-pointer rounded-full border px-3 py-1.5 text-sm transition"
      :style="{
        color: dark ? '#c9c9d4' : '#44443e',
        borderColor: dark ? '#33333f' : '#d8d8d2'
      }"
      @click="toggleBg"
    >
      {{ dark ? '☀ Light stage' : '☾ Dark stage' }}
    </button>

    <button
      type="button"
      class="cursor-pointer"
      aria-label="Poke the avatar"
      @click="poke"
    >
      <TheOwlOpsBot
        v-model:state="state"
        v-model:block="block"
        v-model:elapsed="elapsed"
        v-model:playing="playing"
        :cycle="cycle"
        :size="size"
        :shape="cfg.shape"
        :color="cfg.color"
        :expression="cfg.expression"
        :accessory="cfg.accessory"
        :paper="paper"
        follow
      />
    </button>

    <p
      class="pointer-events-none absolute bottom-8 px-6 text-center text-sm transition-opacity duration-1000"
      :style="{ color: dark ? '#8a8a99' : '#7a7a72', opacity: hintVisible ? 1 : 0 }"
    >
      Move your cursor — it watches you. Click it — it celebrates.
      <span v-if="!cfg.described">
        This is a demo bot; <a :href="studioHref" class="underline underline-offset-2">bring yours</a>
        with a studio share link.
      </span>
    </p>
  </main>
</template>
