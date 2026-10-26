/**
 * The DOM player: mounts an animated avatar into any element and drives the
 * engine with a requestAnimationFrame clock — the same playback semantics as
 * the reference component (bounded-delta clock, morphing state changes,
 * cycles that advance block by block, an engine that keeps breathing when
 * playback is paused). Framework-free: React, Vue, Svelte and vanilla chat
 * apps all consume this same player.
 *
 * ```ts
 * import { createAvatar } from '@theowlops/rogue-avatar-core'
 *
 * const avatar = createAvatar(document.querySelector('#bot')!, { size: 96 })
 * avatar.setPhase('thinking')
 * // …later…
 * avatar.setPhase('idle')
 * avatar.destroy()
 * ```
 */
import { phasePlan, type ChatPhase } from './chat.js'
import { defaultCycle, type Block } from './bot/cycles.js'
import { BotEngine } from './bot/engine.js'
import { EXPRESSION_BY_ID, DEFAULT_EXPRESSION, type BotExpression } from './bot/expressions.js'
import { DEMI_VIEWBOX, RAYON } from './bot/repere.js'
import {
  COLOR_BY_ID,
  DEFAULT_COLOR,
  DEFAULT_SHAPE,
  SHAPE_BY_ID
} from './bot/skins.js'
import type { StateId } from './bot/states.js'
import { renderFrame } from './render.js'

export interface AvatarOptions {
  /** Pixel size (square). Default 320. The svg scales to its container if the container is sized instead. */
  size?: number
  /** Initial animation state. Default `idle`. */
  state?: StateId
  /** Initial chat phase (wins over `state` when both are given). */
  phase?: ChatPhase
  /** Play a cycle of blocks instead of a single state. */
  cycle?: Block[]
  /** Shape id from the catalogue (`SHAPES`). Default `cercle`. */
  shape?: string
  /** Colour id from the catalogue (`COLORS`). Default `encre`. */
  color?: string
  /** Rest-expression id from the catalogue (`EXPRESSIONS`). Default `neutre`. */
  expression?: string
  /** Background colour the eyes see through to. Default `#f9f9f9`. */
  paper?: string
  /** Start with cycle playback paused (the avatar still breathes). Default false. */
  paused?: boolean
  /**
   * Freeze at this instant (seconds into the state) and don't start the
   * animation loop — for thumbnails and static previews. Setters still
   * redraw the frozen frame.
   */
  frozenAt?: number
}

export interface AvatarHandle {
  /** Morph to a single animation state (leaves cycle mode). */
  setState(state: StateId): void
  /** Play a chat phase: a state or a looping cycle, per `CHAT_PHASE_PLANS`. */
  setPhase(phase: ChatPhase): void
  /** Loop a custom cycle of `{ state, duration }` blocks. */
  setCycle(blocks: Block[]): void
  /** Morph the body to a catalogue shape. */
  setShape(shapeId: string): void
  /** Recolour the body to a catalogue colour. */
  setColor(colorId: string): void
  /** Change the rest expression. */
  setExpression(expressionId: string): void
  /** Pause cycle advancement (the avatar keeps breathing and blinking). */
  pause(): void
  /** Resume cycle advancement from where it stopped. */
  resume(): void
  /** The state currently on the engine. */
  readonly state: StateId
  /** Stop the loop and empty the container. */
  destroy(): void
}

let uidCounter = 0

export function createAvatar(el: HTMLElement, opts: AvatarOptions = {}): AvatarHandle {
  const uid = `rogue-avatar-${++uidCounter}`
  const paper = opts.paper ?? '#f9f9f9'
  const VB = DEMI_VIEWBOX

  let ink = COLOR_BY_ID.get(opts.color ?? DEFAULT_COLOR)?.hex ?? '#0a0a0c'
  const shapeRadii = SHAPE_BY_ID.get(opts.shape ?? DEFAULT_SHAPE)?.radii ?? null
  const expression: BotExpression | null =
    EXPRESSION_BY_ID.get(opts.expression ?? DEFAULT_EXPRESSION) ?? null

  const engine = new BotEngine(RAYON, opts.state ?? 'idle', shapeRadii, expression)

  el.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" ` +
    `viewBox="${-VB} ${-VB} ${VB * 2} ${VB * 2}" role="img" aria-label="bot avatar" style="display:block"></svg>`
  if (opts.size !== undefined) {
    el.style.width = `${opts.size}px`
    el.style.height = `${opts.size}px`
  }
  const svg = el.firstElementChild as SVGSVGElement

  const draw = (t: number) => {
    svg.innerHTML = renderFrame(engine.sample(t), { ink, paper, uid })
  }

  /* ------------------------------------------------------------ playback */
  let clock = 0
  let raf = 0
  let last = 0
  let blocks: Block[] | null = null
  let blockIndex = 0
  let blockStart = 0
  let elapsedInBlock = 0
  let nextAt = Infinity
  let playing = !(opts.paused ?? false)

  function applyBlock(i: number, from = 0) {
    const b = blocks?.[i]
    if (!b) {
      nextAt = Infinity
      return
    }
    blockIndex = i
    blockStart = clock - from
    elapsedInBlock = from
    engine.setState(b.state, clock)
    nextAt = playing ? blockStart + b.duration : Infinity
  }

  function tick(ms: number) {
    raf = requestAnimationFrame(tick)
    // Bounded-delta scene clock: a hidden tab resumes without a time jump.
    const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0
    last = ms
    clock += dt
    if (blocks && playing) {
      if (clock >= nextAt && blocks.length) {
        applyBlock((blockIndex + 1) % blocks.length)
      } else {
        elapsedInBlock = clock - blockStart
      }
    }
    draw(clock)
  }

  const frozen = opts.frozenAt !== undefined
  if (frozen) {
    draw(opts.frozenAt as number)
  } else {
    raf = requestAnimationFrame(tick)
  }
  const redrawFrozen = () => {
    if (frozen) draw(opts.frozenAt as number)
  }

  /* -------------------------------------------------------------- handle */
  const handle: AvatarHandle = {
    setState(state: StateId) {
      blocks = null
      nextAt = Infinity
      engine.setState(state, clock)
      redrawFrozen()
    },
    setPhase(phase: ChatPhase) {
      const plan = phasePlan(phase)
      if (plan.kind === 'state') handle.setState(plan.state)
      else handle.setCycle(plan.blocks)
    },
    setCycle(newBlocks: Block[]) {
      blocks = newBlocks.length ? newBlocks : null
      if (blocks) applyBlock(0)
      redrawFrozen()
    },
    setShape(shapeId: string) {
      engine.setShape(SHAPE_BY_ID.get(shapeId)?.radii ?? null, clock)
      redrawFrozen()
    },
    setColor(colorId: string) {
      ink = COLOR_BY_ID.get(colorId)?.hex ?? ink
      if (frozen) redrawFrozen()
      else draw(clock)
    },
    setExpression(expressionId: string) {
      engine.setExpression(EXPRESSION_BY_ID.get(expressionId) ?? null, clock)
      redrawFrozen()
    },
    pause() {
      playing = false
      nextAt = Infinity
    },
    resume() {
      playing = true
      if (blocks) applyBlock(blockIndex, elapsedInBlock)
    },
    get state() {
      return engine.state
    },
    destroy() {
      cancelAnimationFrame(raf)
      el.innerHTML = ''
    }
  }

  // Initial playback mode: explicit cycle > phase > single state.
  if (opts.cycle) handle.setCycle(opts.cycle)
  else if (opts.phase) handle.setPhase(opts.phase)
  else if (opts.state) engine.setState(opts.state, 0)

  return handle
}

/** Convenience: the default showcase cycle (all catalogue states in order). */
export function showcaseCycle(): Block[] {
  return defaultCycle().blocks
}
