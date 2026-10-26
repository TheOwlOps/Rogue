<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  COLORS,
  EXPRESSIONS,
  SHAPES,
  createAvatar,
  type AvatarHandle,
  type ChatPhase,
  type StateId
} from '@theowlops/rogue-avatar-core'

/**
 * The chat demo: the avatar in its natural habitat. Everything on this page
 * is driven through the public SDK surface (`createAvatar` + `setPhase` +
 * the catalogue setters) — the same calls a real chat app makes. Send a
 * message and watch the bot think, work, type, and celebrate; or drive the
 * phases yourself with the chips.
 */

interface Msg {
  from: 'bot' | 'user'
  text: string
}

const PHASES: Array<{ id: ChatPhase; label: string; status: string }> = [
  { id: 'idle', label: 'Idle', status: 'Online' },
  { id: 'listening', label: 'Listening', status: 'Listening…' },
  { id: 'thinking', label: 'Thinking', status: 'Thinking…' },
  { id: 'working', label: 'Working', status: 'Working on it…' },
  { id: 'typing', label: 'Typing', status: 'Typing…' },
  { id: 'speaking', label: 'Speaking', status: 'Speaking…' },
  { id: 'happy', label: 'Happy', status: 'Pleased' },
  { id: 'celebrating', label: 'Celebrating', status: 'Nailed it 🎉' },
  { id: 'error', label: 'Error', status: 'Something went wrong' },
  { id: 'sleeping', label: 'Sleeping', status: 'Away 💤' }
]

const REPLIES = [
  'Done! I turned that into a plan, checked the details twice, and everything lines up. ✅',
  'Great question — short answer: yes. Longer answer: it depends on the shape of the problem, and I have opinions.',
  'I searched, I compared, I doubted myself once — here is the version I actually trust.',
  'Task complete. The confetti is not optional, I have decided. 🎉',
  'On it. I will bring back something concrete, not a shrug with bullet points.'
]

const host = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const messages = ref<Msg[]>([
  { from: 'bot', text: 'Hi! I am the Rogue avatar, alive in a chat. Send me a message — or poke the phase chips — and watch my face work.' }
])
const input = ref('')
const status = ref('Online')
const activePhase = ref<ChatPhase>('idle')
const busy = ref(false)
const shape = ref('cercle')
const color = ref('encre')
const expression = ref('neutre')

let avatar: AvatarHandle | null = null
let replyIndex = 0
const timers: number[] = []
let streamTimer = 0

function later(fn: () => void, ms: number) {
  timers.push(window.setTimeout(fn, ms))
}
function clearFlow() {
  for (const t of timers) clearTimeout(t)
  timers.length = 0
  clearInterval(streamTimer)
  busy.value = false
}

function setPhase(phase: ChatPhase, text: string) {
  activePhase.value = phase
  status.value = text
  avatar?.setPhase(phase)
}

function scrollDown() {
  void nextTick(() => {
    const el = scroller.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function send() {
  const text = input.value.trim()
  if (!text || busy.value) return
  input.value = ''
  clearFlow()
  busy.value = true
  messages.value.push({ from: 'user', text })
  scrollDown()

  const reply = REPLIES[replyIndex++ % REPLIES.length]!
  setPhase('thinking', 'Thinking…')
  later(() => setPhase('working', 'Working on it…'), 1300)
  later(() => {
    setPhase('typing', 'Typing…')
    const msg: Msg = { from: 'bot', text: '' }
    messages.value.push(msg)
    scrollDown()
    let i = 0
    streamTimer = window.setInterval(() => {
      i = Math.min(reply.length, i + 2)
      msg.text = reply.slice(0, i)
      scrollDown()
      if (i >= reply.length) {
        clearInterval(streamTimer)
        later(() => {
          setPhase('celebrating', 'Nailed it 🎉')
          later(() => {
            setPhase('idle', 'Online')
            busy.value = false
          }, 1700)
        }, 250)
      }
    }, 18)
  }, 3100)
}

function pokePhase(p: (typeof PHASES)[number]) {
  clearFlow()
  setPhase(p.id, p.status)
}

/**
 * Poke the avatar: a one-shot reaction, then back to whatever phase it was
 * in. Ignored mid-flow — a bot streaming an answer shouldn't be interrupted
 * by a poke.
 */
const POKE_REACTIONS: StateId[] = ['shocked', 'laugh', 'love', 'dizzy', 'sparkle']
let pokeTimer = 0
function pokeAvatar() {
  if (!avatar || busy.value) return
  const reaction = POKE_REACTIONS[Math.floor(Math.random() * POKE_REACTIONS.length)]!
  avatar.setState(reaction)
  clearTimeout(pokeTimer)
  pokeTimer = window.setTimeout(() => avatar?.setPhase(activePhase.value), 1500)
}

onMounted(() => {
  if (!host.value) return
  avatar = createAvatar(host.value, { size: 56, paper: '#ffffff' })
})

onBeforeUnmount(() => {
  clearFlow()
  avatar?.destroy()
  avatar = null
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center bg-[var(--paper)] px-4 py-6 text-[var(--ink)]">
    <div class="w-full max-w-md">
      <div class="mb-4 flex items-baseline justify-between">
        <span class="flex gap-4">
          <a href="index.html" class="text-sm text-[var(--muted)] underline-offset-2 hover:underline">← Studio</a>
          <a href="party.html" class="text-sm text-[var(--muted)] underline-offset-2 hover:underline">Party 🎉</a>
        </span>
        <span class="text-xs tracking-wide text-[var(--muted)]">ROGUE · CHAT DEMO</span>
      </div>

      <div class="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
        <!-- header: the avatar, alive -->
        <div class="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
          <div
            ref="host"
            class="h-14 w-14 flex-none cursor-pointer"
            title="Poke me!"
            @click="pokeAvatar"
          ></div>
          <div class="min-w-0">
            <p class="truncate font-semibold">Rogue Bot</p>
            <p class="text-sm text-[var(--muted)]">{{ status }}</p>
          </div>
        </div>

        <!-- messages -->
        <div ref="scroller" class="h-[42vh] space-y-2 overflow-y-auto px-4 py-4">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-wrap"
            :class="
              m.from === 'user'
                ? 'ml-auto bg-[var(--ink)] text-[var(--paper)]'
                : 'bg-black/5'
            "
          >
            {{ m.text }}<span v-if="m.text === ''" class="opacity-50">…</span>
          </div>
        </div>

        <!-- phase chips: drive the bot by hand -->
        <div class="flex flex-wrap gap-1.5 border-t border-[var(--line)] px-4 py-3">
          <button
            v-for="p in PHASES"
            :key="p.id"
            type="button"
            class="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition"
            :class="
              activePhase === p.id
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                : 'border-[var(--line)] hover:bg-black/5'
            "
            @click="pokePhase(p)"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- composer -->
        <form class="flex gap-2 border-t border-[var(--line)] px-4 py-3" @submit.prevent="send">
          <input
            v-model="input"
            type="text"
            placeholder="Message the bot…"
            class="min-w-0 flex-1 rounded-full border border-[var(--line)] px-4 py-2 text-[15px] outline-none focus:border-[var(--ink)]"
          />
          <button
            type="submit"
            class="flex-none cursor-pointer rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] transition hover:opacity-85 disabled:opacity-40"
            :disabled="busy || !input.trim()"
          >
            Send
          </button>
        </form>
      </div>

      <!-- dress the bot: the same catalogue as the studio -->
      <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
        <label class="flex flex-col gap-1">
          <span class="text-xs text-[var(--muted)]">Shape</span>
          <select
            v-model="shape"
            class="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 capitalize"
            @change="avatar?.setShape(shape)"
          >
            <option v-for="s in SHAPES" :key="s.id" :value="s.id">{{ s.id }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs text-[var(--muted)]">Colour</span>
          <select
            v-model="color"
            class="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 capitalize"
            @change="avatar?.setColor(color)"
          >
            <option v-for="c in COLORS" :key="c.id" :value="c.id">{{ c.id }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs text-[var(--muted)]">Face</span>
          <select
            v-model="expression"
            class="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 capitalize"
            @change="avatar?.setExpression(expression)"
          >
            <option v-for="e in EXPRESSIONS" :key="e.id" :value="e.id">{{ e.id }}</option>
          </select>
        </label>
      </div>

      <p class="mt-4 text-center text-xs leading-relaxed text-[var(--muted)]">
        One engine, every face: 66 animation states · 20 shapes · 28 expressions · 36 colours.<br />
        Powered by <code>@theowlops/rogue-avatar-core</code> — phases, not plumbing.
      </p>
    </div>
  </div>
</template>
