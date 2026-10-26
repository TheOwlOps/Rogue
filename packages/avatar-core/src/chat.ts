/**
 * Chat-phase presets: the small vocabulary a chat app actually speaks.
 *
 * A chat UI never thinks in terms of 66 animation states — it thinks "the bot
 * is idle / thinking / working / typing an answer / celebrating / offline".
 * This module maps each such phase to either a single engine state or a
 * looping cycle of states, so an integration is one call:
 *
 * ```ts
 * avatar.setPhase('thinking')   // when the request goes out
 * avatar.setPhase('working')    // while tools run
 * avatar.setPhase('typing')     // while the answer streams
 * avatar.setPhase('idle')       // when it's done
 * ```
 *
 * The working/thinking cycles intentionally chain several states instead of
 * pinning one animation: an avatar that visibly *keeps moving* while the bot
 * works reads as alive; a single looped gesture reads as a loading spinner.
 */
import type { Block } from './bot/cycles.js'
import type { StateId } from './bot/states.js'

export type ChatPhase =
  | 'offline'
  | 'sleeping'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'working'
  | 'typing'
  | 'speaking'
  | 'happy'
  | 'celebrating'
  | 'error'

export type PhasePlan = { kind: 'state'; state: StateId } | { kind: 'cycle'; blocks: Block[] }

const cycle = (...blocks: [StateId, number][]): PhasePlan => ({
  kind: 'cycle',
  blocks: blocks.map(([state, duration]) => ({ state, duration }))
})

export const CHAT_PHASE_PLANS: Record<ChatPhase, PhasePlan> = {
  offline: { kind: 'state', state: 'sleep' },
  sleeping: { kind: 'state', state: 'sleep' },
  idle: { kind: 'state', state: 'idle' },
  listening: { kind: 'state', state: 'wide' },
  thinking: cycle(['thinking', 2.4], ['ponder', 2], ['thinking', 2], ['wide', 1.2]),
  working: cycle(['play', 2.2], ['orbit', 2.6], ['comet', 2], ['burst', 1.6]),
  typing: { kind: 'state', state: 'thinking' },
  speaking: cycle(['play', 2], ['wave', 1.8]),
  happy: cycle(['dance', 2], ['heart', 2.2], ['sparkle', 1.8]),
  celebrating: cycle(['burst', 1.6], ['fireworks', 2.4], ['confetti', 2], ['dance', 2]),
  error: { kind: 'state', state: 'dizzy' }
}

/** Resolve a chat phase to the state or cycle the engine should play. */
export function phasePlan(phase: ChatPhase): PhasePlan {
  return CHAT_PHASE_PLANS[phase]
}
