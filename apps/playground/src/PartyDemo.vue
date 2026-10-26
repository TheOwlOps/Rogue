<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  COLORS,
  EXPRESSIONS,
  SHAPES,
  createAvatar,
  type AvatarHandle,
  type StateId
} from '@theowlops/rogue-avatar-core'

/**
 * The avatar party: a whole dance floor of bots, each with a random look and
 * its own random fun cycle, all driven through the public SDK surface.
 * Click a bot and it celebrates; the buttons conduct the whole floor.
 * Bounce/hop stay out of the random pools — the floor grooves, it doesn't
 * pogo.
 */

const FUN_POOL: StateId[] = [
  'dance', 'spin', 'flip', 'wiggle', 'swing', 'float', 'drift', 'roll',
  'wave', 'galaxy', 'fireworks', 'confetti', 'sparkle', 'bubbles', 'heart',
  'star', 'rocket', 'ufo', 'ghost', 'vinyl', 'orbit', 'comet', 'burst',
  'laugh', 'love'
]
const REACTIONS: StateId[] = ['burst', 'heart', 'fireworks', 'laugh', 'love', 'sparkle', 'confetti']
const NAMES = [
  'Mochi', 'Boba', 'Kiki', 'Momo', 'Luna', 'Milo', 'Piko', 'Nana', 'Taro',
  'Yuki', 'Bibi', 'Lulu', 'Coco', 'Puff', 'Miso', 'Sora', 'Hana', 'Pudding',
  'Waffle', 'Berry', 'Ghost', 'Cosmos', 'Royal', 'Pixel', 'Noodle', 'Biscuit'
]

interface Bot {
  id: number
  name: string
}
interface Live {
  handle: AvatarHandle
  cycle: Array<{ state: StateId; duration: number }>
  timer: number
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!
const counts = [8, 12, 16, 24]
const count = ref(12)
const bots = ref<Bot[]>([])
const pokedId = ref<number | null>(null)

const hosts = new Map<number, HTMLElement>()
const live = new Map<number, Live>()
let nameDeck: string[] = []

function shuffledNames(): string[] {
  const deck = [...NAMES]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  return deck
}

function randomCycle(): Live['cycle'] {
  const n = 2 + Math.floor(Math.random() * 2)
  return Array.from({ length: n }, () => ({
    state: pick(FUN_POOL),
    duration: 1.8 + Math.random() * 1.6
  }))
}

function setHost(id: number, el: unknown) {
  if (el instanceof HTMLElement) hosts.set(id, el)
  else hosts.delete(id)
}

function spawn(bot: Bot) {
  const host = hosts.get(bot.id)
  if (!host) return
  const handle = createAvatar(host, {
    size: 84,
    shape: pick(SHAPES).id,
    color: pick(COLORS).id,
    expression: pick(EXPRESSIONS).id
  })
  const cycle = randomCycle()
  handle.setCycle(cycle)
  live.set(bot.id, { handle, cycle, timer: 0 })
}

function teardown() {
  for (const l of live.values()) {
    clearTimeout(l.timer)
    l.handle.destroy()
  }
  live.clear()
}

async function buildFloor() {
  teardown()
  nameDeck = shuffledNames()
  bots.value = Array.from({ length: count.value }, (_, i) => ({
    id: i,
    name: nameDeck[i % nameDeck.length]!
  }))
  await nextTick()
  for (const bot of bots.value) spawn(bot)
}

function poke(bot: Bot) {
  const l = live.get(bot.id)
  if (!l) return
  clearTimeout(l.timer)
  l.handle.setState(pick(REACTIONS))
  pokedId.value = bot.id
  window.setTimeout(() => {
    if (pokedId.value === bot.id) pokedId.value = null
  }, 350)
  l.timer = window.setTimeout(() => l.handle.setCycle(l.cycle), 1750)
}

function danceAll() {
  for (const l of live.values()) {
    clearTimeout(l.timer)
    l.cycle = [
      { state: 'dance', duration: 2.2 },
      { state: pick(['swing', 'wiggle', 'spin'] as StateId[]), duration: 2 },
      { state: 'dance', duration: 2.2 }
    ]
    l.handle.setCycle(l.cycle)
  }
}

function chillAll() {
  for (const l of live.values()) {
    clearTimeout(l.timer)
    l.cycle = [
      { state: 'float', duration: 3.4 },
      { state: 'idle', duration: 3 }
    ]
    l.handle.setCycle(l.cycle)
  }
}

function celebrateAll() {
  let i = 0
  for (const bot of bots.value) {
    const l = live.get(bot.id)
    if (!l) continue
    clearTimeout(l.timer)
    const delay = i++ * 90
    window.setTimeout(() => l.handle.setState(pick(REACTIONS)), delay)
    l.timer = window.setTimeout(() => l.handle.setCycle(l.cycle), delay + 1750)
  }
}

onMounted(buildFloor)
onBeforeUnmount(teardown)
</script>

<template>
  <div class="min-h-screen bg-[var(--paper)] px-4 py-6 text-[var(--ink)]">
    <div class="mx-auto w-full max-w-5xl">
      <div class="mb-1 flex items-baseline justify-between">
        <div class="flex gap-4 text-sm">
          <a href="index.html" class="text-[var(--muted)] underline-offset-2 hover:underline">← Studio</a>
          <a href="chat.html" class="text-[var(--muted)] underline-offset-2 hover:underline">Chat demo</a>
        </div>
        <span class="text-xs tracking-wide text-[var(--muted)]">ROGUE · AVATAR PARTY</span>
      </div>

      <h1 class="mt-3 text-center text-3xl font-bold">🎉 Avatar Party</h1>
      <p class="mt-1 text-center text-sm text-[var(--muted)]">
        Every bot below has a random face and its own groove. Click one to make it celebrate.
      </p>

      <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" class="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm font-medium transition hover:bg-black/5" @click="danceAll">💃 Dance all</button>
        <button type="button" class="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm font-medium transition hover:bg-black/5" @click="celebrateAll">🎉 Celebrate</button>
        <button type="button" class="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm font-medium transition hover:bg-black/5" @click="chillAll">😌 Chill</button>
        <button type="button" class="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm font-medium transition hover:bg-black/5" @click="buildFloor">🎲 Shuffle the floor</button>
        <label class="ml-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
          Bots
          <select v-model.number="count" class="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-[var(--ink)]" @change="buildFloor">
            <option v-for="n in counts" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
      </div>

      <div class="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <button
          v-for="bot in bots"
          :key="bot.id"
          type="button"
          class="cursor-pointer rounded-3xl border border-[var(--line)] bg-white px-2 pt-3 pb-2 shadow-sm transition hover:shadow"
          :class="pokedId === bot.id && 'scale-105'"
          :title="`Poke ${bot.name}`"
          @click="poke(bot)"
        >
          <div :ref="(el) => setHost(bot.id, el)" class="mx-auto h-[84px] w-[84px]"></div>
          <p class="mt-1 truncate text-center text-sm font-medium">{{ bot.name }}</p>
        </button>
      </div>

      <p class="mt-5 text-center text-xs leading-relaxed text-[var(--muted)]">
        One engine, a whole party: 67 animation states · 20 shapes · 52 expressions · 36 colours.<br />
        Powered by <code>@theowlops/rogue-avatar-core</code>.
      </p>
    </div>
  </div>
</template>
