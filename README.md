<div align="center">

# 🦉 Rogue — the living avatar for AI bots

**One morphing avatar that thinks, works, types and celebrates — so your bot feels alive in any chat.**
67 animation states · 20 shapes · 28 expressions · 36 colours · **20,160 looks**

[![▶ Open the studio](https://img.shields.io/badge/▶_Open_the_studio-3b93f0?style=for-the-badge)](https://theowlops.github.io/Rogue/)
[![💬 Chat with it](https://img.shields.io/badge/💬_Chat_with_it-0fa36b?style=for-the-badge)](https://theowlops.github.io/Rogue/chat.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ▶ Just try it — no install, no signup

**[theowlops.github.io/Rogue](https://theowlops.github.io/Rogue/)**

In the first minute you can:

- 🎨 **Dress your bot** — 20 shapes, 28 faces, 36 colours, mixed freely (every combo is eye-safe, machine-verified)
- 👆 **Tap a preset** — 36 ready-made characters: Classic, Cosmos, Candy, Sakura, Lava, Panda, Cyber, Ghost… plus a whole **Cute** shelf 🧸 — Mochi, Pudding, Cupcake, Boba, Bunny, Momo…
- 🎲 **Hit Random** until one makes you smile, then **Copy share link** and send that exact look to a friend
- 🎬 **Open Animations** — all 66 animations on a timeline; build your own montage, export it as a GIF
- 💬 **Open the [chat demo](https://theowlops.github.io/Rogue/chat.html)** — send the bot a message and watch it think → work → type → celebrate; or drive it with the phase chips
- 🖼️ **See everything at once** — [the state board](https://theowlops.github.io/Rogue/#planche) with all 66 states side by side
- 🎉 **Crash the [Avatar Party](https://theowlops.github.io/Rogue/party.html)** — a dance floor of up to 24 bots, each with a random face and its own groove; click one to make it celebrate, conduct the whole floor with Dance / Chill / Celebrate

## What makes it tick

- **Pure SVG, zero dependencies** — the face is computed fresh every frame by a clock-free TypeScript engine: same instant in, same pixels out, anywhere
- **Eyes are real holes** pierced through the body, so they clip at the silhouette's edge exactly like the reference avatar this engine was measured from
- **Built for chat** — drive it by what your bot is *doing*: `idle`, `listening`, `thinking`, `working`, `typing`, `speaking`, `happy`, `celebrating`, `error`, `sleeping`. Busy phases play *cycles* of animations, never one pinned gesture
- **Deterministic** — freeze any state at any instant for thumbnails, exports or pixel-exact tests

The animations, in short: emotions (laugh, cry, love, ponder, sneeze…), motion (dance, spin, flip, float…), shape morphs (star, heart, planet, gear…), effects (fireworks, galaxy, confetti, portal…) and characters (rocket, UFO, robot, ghost…). The full catalogue lives in the studio — go look at it moving, not in a table.

## For developers

```ts
import { createAvatar } from '@theowlops/rogue-avatar-core'

const avatar = createAvatar(document.querySelector('#bot')!, { size: 96 })
avatar.setPhase('working')   // tools running
avatar.setPhase('typing')    // answer streaming
avatar.setPhase('idle')      // done
avatar.setState('galaxy')    // or any of the 67 states, directly
```

React and Vue wrappers ship too (`<RogueAvatar phase="working" />`). Packages: [`avatar-core`](packages/avatar-core) · [`avatar-react`](packages/avatar-react) · [`avatar-vue`](packages/avatar-vue) · studio in [`apps/playground`](apps/playground).

Run it locally:

```bash
git clone https://github.com/TheOwlOps/Rogue.git && cd Rogue
pnpm install && pnpm dev     # studio at http://localhost:5190
pnpm test                    # 219 tests, incl. a 2,900-combination eye-safety sweep
```

## Vision

These avatars are the faces of **Rogue**, an autonomous multi-agent orchestration runtime in the making: specialist agents that plan, delegate, execute and verify — and look alive while they do it. The avatar engine is the first shipped piece.

## Credits

Engine derived from an SVG avatar engine by **Jérémy Perret** (MIT) — see [NOTICE.md](NOTICE.md). The 100-entry expansion pack, SDK, chat demo and studio features were built by TheOwlOps.

[MIT](LICENSE) © TheOwlOps and contributors.
