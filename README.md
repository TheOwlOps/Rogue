<div align="center">

# 🦉 Rogue — the living avatar for AI bots

**One morphing SVG avatar. 67 animation states · 20 shapes · 28 expressions · 36 colours.**
**It thinks, works, types, celebrates — so your bot feels alive in any chat.**

[![▶ Try the live studio](https://img.shields.io/badge/▶_Try_the_live_studio-3b93f0?style=for-the-badge)](https://theowlops.github.io/Rogue/)
[![💬 Try the chat demo](https://img.shields.io/badge/💬_Try_the_chat_demo-0fa36b?style=for-the-badge)](https://theowlops.github.io/Rogue/chat.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## What is this?

Rogue's avatar engine is a **pure-SVG, morphing bot face** — a black sphere whose silhouette, eyes, and decorations are computed fresh every frame by a clock-free TypeScript engine (`sample(t)` is a pure function of time: same `t`, same pixels, on any machine). No animation library, no video, no sprites.

It exists because chat bots deserve better than a static logo and a "typing…" label. When your bot is thinking, it should *look* like it's thinking. When it finishes, it should celebrate. This repo ships:

| Piece | What it does |
|---|---|
| **The engine** (`packages/avatar-core`) | The animation core + the full catalogue below, as a zero-dependency TypeScript package |
| **The studio** (`apps/playground`) | A web app to explore and customise the avatar: customiser, animation timeline, state board, PNG/GIF export — **[live here](https://theowlops.github.io/Rogue/)** |
| **The chat demo** (`apps/playground/chat.html`) | The avatar living in a mock chat — send it a message and watch it work: **[live here](https://theowlops.github.io/Rogue/chat.html)** |
| **React / Vue wrappers** | `<RogueAvatar phase="working" />` components for chat apps |

> Rogue is also the seed of a larger project — an autonomous multi-agent orchestration runtime (see [Vision](#-vision)). The avatar is its face, and it's the part you can use today.

---

## ▶ Try it now

- **Studio:** https://theowlops.github.io/Rogue/ — customise the avatar, browse every animation on the timeline, see all 66 states side by side at [`#planche`](https://theowlops.github.io/Rogue/#planche)
- **Chat demo:** https://theowlops.github.io/Rogue/chat.html — type a message, watch the bot think → work → type → celebrate; or drive it yourself with the phase chips
- **Share a look:** build an avatar in the studio, hit **Copy share link**, send the URL — it opens with your exact shape/colour/face (e.g. `#avatar=coeur.corail.amoureux`)

Run it locally:

```bash
git clone https://github.com/TheOwlOps/Rogue.git
cd Rogue
pnpm install
pnpm dev        # studio at http://localhost:5190, chat demo at /chat.html
pnpm test       # 219 tests, including a 2,900-combination eye-containment sweep
pnpm build      # build every package + the studio
```

---

## Features

- **67 animation states** — emotions, motion, shape morphs, particle effects, characters (full catalogue below)
- **20 body shapes × 28 rest expressions × 36 colours** — every combination is safe: an automated sweep proves the eyes never escape the silhouette, in any combo, at any instant
- **Chat phases** — drive the avatar the way chat apps think: `idle`, `thinking`, `working`, `typing`, `celebrating`… phases that must keep moving play *cycles* of states, never one pinned gesture
- **Real holes for eyes** — the eyes are pierced through the body with a mask, so they clip naturally at the silhouette's edge, exactly like the reference this engine was measured from
- **Pure & deterministic** — the engine has no clock, no DOM, no dependencies; freeze any state at any instant for thumbnails, SSR, or pixel-exact exports
- **Studio included** — timeline editor for building animation montages, cycle manager, PNG/GIF export, 3 languages (Français / English / 简体中文)
- **New in the studio:** **24 one-click Presets** (Classic, Cosmos, Candy, Sakura, Lava, Panda, Cyber, Ghost… — together they cover all 20 shapes), a 🎲 **Random** button, and **share links** that carry a whole look in the URL

---

## 🎬 The catalogue — animation states (67)

### Core states

| State | id | What it does |
|---|---|---|
| Idle | `idle` | Breathing rest pose with blinks and a wandering gaze — the home face |
| Thinking | `thinking` | Three dots pulsing in a row — the classic "bot is typing" |
| Wink | `wink` | One eye closes in a wink |
| Wide eyes | `wide` | Eyes stretch wide open, alert and curious |
| Alert | `alert` | The body vanishes; a tilted exclamation mark remains |
| Notification | `notif` | A blue notification dot pops onto the rim |
| Exclamation | `exclaim` | An exclamation mark that leaps up and lands |
| Sleep | `sleep` | Everything shrinks down to a single sleeping dot |
| Egg | `egg` | Morphs into an egg |
| Hexagon | `hexagon` | Morphs into a hexagon |
| Play | `play` | Morphs into a play-button triangle while orbit rings sweep past |
| Orbit | `orbit` | Coloured orbit rings circle the sphere |
| Burst | `burst` | Bursts into particles and reforms |
| Comet | `comet` | Becomes a comet trailing rainbow ribbons |
| Swirl | `swirl` | A full 360° spin — the transition state between states (not in the playable sequence) |

### Motion

| State | id | What it does |
|---|---|---|
| Bounce | `bounce` | Joyful squash-and-stretch bouncing |
| Dance | `dance` | Side-to-side groove with tilted eyes |
| Spin | `spin` | Continuous spin — the body rolls, the eyes orbit |
| Flip | `flip` | A full backflip with a squash on landing |
| Wiggle | `wiggle` | Rapid side-to-side wiggle |
| Swing | `swing` | Pendulum swing, eyes sliding with the momentum |
| Hop | `hop` | Three little hops |
| Float | `float` | Weightless levitation, slow rise and fall |
| Drift | `drift` | Slow, dreamy drift across the frame |
| Roll | `roll` | Rolls like a wheel, eyes tumbling |

### Shape morphs

| State | id | What it does |
|---|---|---|
| Star | `star` | Morphs into a five-pointed star |
| Heart | `heart` | Morphs into a heart that beats twice — lub-dub |
| Diamond | `diamond` | Morphs into a diamond |
| Square | `square` | Morphs into a square |
| Pentagon | `pentagon` | Morphs into a pentagon |
| Octagon | `octagon` | Morphs into an octagon |
| Flower | `flower` | Blooms into a flower |
| Sun | `sun` | Morphs into a sun with triangular rays |
| Blob | `blob` | Melts into a living, wobbling blob |
| Wave | `wave` | The silhouette ripples like a wave |
| Gear | `gear` | Morphs into a slowly rotating gear |
| Planet | `planet` | A ringed planet with a moon orbiting it |

### Emotions

| State | id | What it does |
|---|---|---|
| Dizzy | `dizzy` | Spiral-eyed, wobbling |
| Laugh | `laugh` | Shaking with laughter, eyes squeezed shut |
| Cry | `cry` | Blue tears falling |
| Love | `love` | Besotted, with little hearts floating up |
| Angry | `angry` | Tilted brows, trembling with rage |
| Shocked | `shocked` | Frozen wide-eyed shock, then a slow recovery |
| Yawn | `yawn` | A big, sleepy yawn |
| Peek | `peek` | Eyes peek out from behind the rim |
| Sneeze | `sneeze` | A three-beat sneeze: wind-up… blast… recovery |
| Proud | `proud` | Chin up, smug slow blink |
| Bashful | `bashful` | Blushing cheeks, a shy glance away |
| Ponder | `ponder` | Thought bubbles rising — deep in thought |

### Effects

| State | id | What it does |
|---|---|---|
| Rainbow | `rainbow` | Rings cycling through the spectrum |
| Fireworks | `fireworks` | Colour bursts exploding around the body |
| Sparkle | `sparkle` | Twinkling sparkles |
| Rain | `rain` | Rain streaks falling past |
| Snow | `snow` | Snowflakes drifting down |
| Bubbles | `bubbles` | Bubbles floating up and popping |
| Confetti | `confetti` | Confetti raining in colour |
| Halo | `halo` | A golden halo rises and settles above |
| Sonar | `sonar` | Expanding sonar rings |
| Portal | `portal` | A swirling portal vortex |
| Galaxy | `galaxy` | Five coloured orbits with star sparkles — the showpiece |
| Meteor | `meteor` | A meteor streaks across with a fading trail |

### Characters & objects

| State | id | What it does |
|---|---|---|
| Rocket | `rocket` | Morphs into a rocket with flickering exhaust |
| UFO | `ufo` | A flying saucer with blinking rim lights, beaming down |
| Robot | `robot` | A square robot head, antenna light blinking |
| Ghost | `ghost` | A floating ghost with a wavy hem |
| Vinyl | `vinyl` | A spinning record with orbiting notes |
| Target | `target` | A pulsing target reticle |

---

## 🧩 Shapes (20) · 😀 Expressions (28) · 🎨 Colours (36)

**Shapes** — Circle `cercle` · Pebble `galet` · Squircle `squircle` · Capsule `capsule` · Triangle `triangle` · Hexagon `hexagone` · Cloud `nuage` · Droplet `goutte` · Star `etoile` · Square `carre` · Diamond `diamant` · Pentagon `pentagone` · Octagon `octogone` · Heart `coeur` · Sun `soleil` · Flower `fleur` · Oval `ovale` · Pill `pilule` · Pear `poire` · Blob `blob`

**Expressions** — Neutral `neutre` · Attentive `attentif` · Surprised `surpris` · Excited `excite` · Happy `heureux` · Hilarious `hilare` · Angry `colere` · Sad `triste` · Scared `effraye` · Wary `mefiant` · Confused `confus` · Curious `curieux` · Proud `fier` · Shy `timide` · Jaded `blase` · Sleepy `somnolent` · In love `amoureux` · Awestruck `bahi` · Furious `furieux` · Disgusted `degoute` · Sly `sournois` · Dreamy `reveur` · Sick `malade` · Panicked `panique` · Zen `zen` · Dazzled `ebloui` · Teasing `moqueur` · Determined `determine`

**Colours**

| Colour | id | hex | | Colour | id | hex |
|---|---|---|---|---|---|---|
| Ink | `encre` | `#0a0a0c` | | Coral | `corail` | `#ff6f61` |
| Brown | `brun` | `#8b5e3c` | | Salmon | `saumon` | `#fa8072` |
| Red | `rouge` | `#e8483f` | | Peach | `peche` | `#f2a65a` |
| Orange | `orange` | `#f08a24` | | Mint | `menthe` | `#3ddc97` |
| Amber | `ambre` | `#f0b429` | | Sky | `ciel` | `#6ec6e8` |
| Green | `vert` | `#3ecf8e` | | Lavender | `lavande` | `#b39ddb` |
| Turquoise | `turquoise` | `#2fbfa0` | | Lilac | `lilas` | `#c86dd7` |
| Blue | `bleu` | `#3b93f0` | | Fuchsia | `fuchsia` | `#d6339c` |
| Violet | `violet` | `#8b5cf6` | | Bordeaux | `bordeaux` | `#8e2434` |
| Pink | `rose` | `#e152b0` | | Olive | `olive` | `#7d8c46` |
| Grey | `gris` | `#a3a3a3` | | Khaki | `kaki` | `#a8a24a` |
| Cream | `creme` | `#f1efe9` | | Sand | `sable` | `#d9b382` |
| | | | | Chocolate | `chocolat` | `#5c3a21` |
| | | | | Slate | `ardoise` | `#64748b` |
| | | | | Navy | `marine` | `#25407a` |
| | | | | Cyan | `cyan` | `#22c3e6` |
| | | | | Magenta | `magenta` | `#e0218a` |
| | | | | Lime | `citron` | `#b8cc18` |
| | | | | Plum | `prune` | `#6c3483` |
| | | | | Silver | `argent` | `#c3cbd2` |
| | | | | Gold | `or` | `#c9a227` |
| | | | | Copper | `cuivre` | `#b87333` |
| | | | | Emerald | `emeraude` | `#0fa36b` |
| | | | | Sapphire | `saphir` | `#2456c8` |

> That's **20 × 28 × 36 = 20,160** base looks — before animation states enter into it.

---

## 💬 Chat phases — the chat-app API

Chat apps don't think in animation states; they think in *what the bot is doing*. The SDK maps that vocabulary onto the catalogue:

| Phase | When | Plays |
|---|---|---|
| `offline` / `sleeping` | Bot away | `sleep` |
| `idle` | Resting, breathing, blinking | `idle` |
| `listening` | User is speaking | `wide` |
| `thinking` | Waiting on the model | cycle: thinking → ponder → thinking → wide |
| `working` | Running tools | cycle: play → orbit → comet → burst |
| `typing` | Answer streaming in | `thinking` (the three dots) |
| `speaking` | Reading the answer aloud | cycle: play → wave |
| `happy` | A positive moment | cycle: dance → heart → sparkle |
| `celebrating` | Task nailed | cycle: burst → fireworks → confetti → dance |
| `error` | Something went wrong | `dizzy` |

---

## 🛠️ Use it in your app

Vanilla (any framework, or none):

```ts
import { createAvatar } from '@theowlops/rogue-avatar-core'

const avatar = createAvatar(document.querySelector('#bot-avatar')!, {
  size: 96,
  shape: 'etoile',       // any of the 20 shapes
  color: 'saphir',       // any of the 36 colours
  expression: 'reveur'   // any of the 28 expressions
})

avatar.setPhase('thinking')    // request in flight
avatar.setPhase('working')     // tools running
avatar.setPhase('typing')      // answer streaming
avatar.setPhase('idle')        // done
avatar.setState('galaxy')      // …or drive any of the 67 states directly
avatar.setCycle([{ state: 'rocket', duration: 2 }, { state: 'ufo', duration: 3 }])
```

React:

```tsx
import { RogueAvatar } from '@theowlops/rogue-avatar-react'

<RogueAvatar phase={busy ? 'working' : 'idle'} size={40} shape="coeur" color="corail" />
```

Vue:

```vue
<script setup>
import { RogueAvatar } from '@theowlops/rogue-avatar-vue'
</script>

<RogueAvatar :phase="busy ? 'working' : 'idle'" :size="40" />
```

No player needed — server-render or snapshot any instant:

```ts
import { BotEngine, frameToSvg } from '@theowlops/rogue-avatar-core'

const engine = new BotEngine(100, 'galaxy')
const svg = frameToSvg(engine.sample(1.2))   // a complete <svg>…</svg> string
```

---

## 🎛️ Studio guide

| View | What you can do |
|---|---|
| **Customise** | Pick from 20 shapes, 28 expressions, 36 colours — or hit 🎲 **Random**, pick a **Preset**, and **Copy share link** to send your exact look to anyone |
| **Animations** | Browse all 66 states, build a montage on the timeline (add blocks, drag durations, reorder), save named cycles, export the result as an animated GIF or a PNG |
| **Settings** | The avatar at giant size, eyes following your cursor; language switcher (Français / English / 简体中文) |
| **Chat demo** (chat icon in the rail, or `/chat.html`) | The avatar in a working chat mock: send messages, watch the think → work → type → celebrate flow, drive phases by hand, re-dress the bot live |

**URL tricks**

| URL | Effect |
|---|---|
| `#planche` | All 66 states frozen side by side |
| `#etat=galaxy` | Open one state, playing |
| `#etat=sneeze&stop` | Open one state, paused at its pose |
| `#avatar=coeur.corail.amoureux` | Open with a shared look (shape.colour.expression) |

---

## 📦 Repository layout

```text
rogue/
├── packages/
│   ├── avatar-core/    # engine + catalogue + renderer + player + chat phases
│   ├── avatar-react/   # <RogueAvatar /> for React
│   └── avatar-vue/     # <RogueAvatar /> for Vue
├── apps/
│   └── playground/     # the studio (index.html) + chat demo (chat.html)
└── .github/workflows/  # CI + GitHub Pages deployment of the studio
```

**Development**

```bash
pnpm install
pnpm dev                                   # studio on :5190
pnpm test                                  # 219 tests across core + studio
pnpm --filter @theowlops/rogue-avatar-core build   # tsc → dist (browser-ready ESM)
pnpm build                                 # everything
```

Testing is taken seriously here: beyond unit tests, a dedicated sweep samples **20 shapes × 29 faces × 5 base states × 60 instants (2,900 combinations)** and fails if an eye ever leaves the silhouette — that's what makes "every combination is safe" a fact rather than a hope. The expansion pack's design notes live in [packages/avatar-core/EXPANSION.md](packages/avatar-core/EXPANSION.md).

---

## 🔭 Vision

Rogue is growing into an **autonomous multi-agent orchestration runtime**: define specialist agents, give them a mission, and let an orchestrator plan, delegate, execute, and verify — locally, with budgets, approval gates, and a full execution trace. These avatars are the faces those agents will wear in the chat apps they work in. The runtime's design contract (concepts, configuration, CLI, safety model) is being drafted in the open in this repository's history; the avatar engine is the first shipped piece.

---

## 🙏 Credits & license

The avatar engine is derived from [bloub](https://github.com/jeremy-prt/bloub) by **Jérémy Perret** — an SVG recreation of the x.ai bot avatar, measured frame by frame from the reference video. The 100-entry expansion pack (52 states, 12 shapes, 12 expressions, 24 colours), the SDK layer, the chat demo, and the studio features on top were built by TheOwlOps. See [NOTICE.md](NOTICE.md).

[MIT](LICENSE) © TheOwlOps and contributors.
