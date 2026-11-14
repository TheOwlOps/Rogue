import { describe, expect, it } from 'vitest'
import { CHAT_PHASE_EXPRESSIONS, CHAT_PHASE_PLANS, phasePlan, type ChatPhase } from './chat.js'
import { BotEngine } from './bot/engine.js'
import { EXPRESSION_BY_ID } from './bot/expressions.js'
import { STATE_BY_ID, type StateId } from './bot/states.js'
import { frameToSvg, renderFrame } from './render.js'

describe('SDK render layer', () => {
  it('renders a complete standalone svg for a sampled frame', () => {
    const engine = new BotEngine(100, 'orbit')
    const svg = frameToSvg(engine.sample(0.8), { uid: 'test' })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="-158 -158 316 316"')
    // orbit has arcs: their gradients must be defined and referenced
    expect(svg).toContain('<linearGradient')
    expect(svg).toContain('url(#test-')
    expect(svg).toContain('</svg>')
  })

  it('every state renders markup without NaN at several instants', () => {
    const engine = new BotEngine(100, 'idle')
    for (const def of STATE_BY_ID.values()) {
      engine.reset(def.id, 0)
      for (const t of [0, 0.37, 1.1, 2.3]) {
        const inner = renderFrame(engine.sample(t), { uid: 'sweep' })
        expect(inner, `${def.id} @ ${t}`).not.toContain('NaN')
        expect(inner).toContain('<mask')
      }
    }
  })

  it('chat phase plans only reference real states with sane durations', () => {
    for (const [phase, plan] of Object.entries(CHAT_PHASE_PLANS)) {
      if (plan.kind === 'state') {
        expect(STATE_BY_ID.has(plan.state), phase).toBe(true)
      } else {
        expect(plan.blocks.length, phase).toBeGreaterThan(1)
        for (const b of plan.blocks) {
          expect(STATE_BY_ID.has(b.state), `${phase}:${b.state}`).toBe(true)
          expect(b.duration).toBeGreaterThan(0)
          expect(b.duration).toBeLessThanOrEqual(10)
        }
      }
    }
    expect(phasePlan('working').kind).toBe('cycle')
    expect(phasePlan('idle')).toEqual({ kind: 'state', state: 'idle' as StateId })
  })

  it('every chat phase wears a real face, or restores the avatar\u2019s own', () => {
    const phases = Object.keys(CHAT_PHASE_PLANS) as ChatPhase[]
    expect(Object.keys(CHAT_PHASE_EXPRESSIONS).sort()).toEqual([...phases].sort())
    for (const phase of phases) {
      const face = CHAT_PHASE_EXPRESSIONS[phase]
      if (face !== null) expect(EXPRESSION_BY_ID.has(face), `${phase}: ${face}`).toBe(true)
    }
    // presence phases impose nothing; mood phases must actually change the face
    expect(CHAT_PHASE_EXPRESSIONS.idle).toBeNull()
    expect(CHAT_PHASE_EXPRESSIONS.thinking).not.toBeNull()
    expect(CHAT_PHASE_EXPRESSIONS.celebrating).not.toBeNull()
  })
})
