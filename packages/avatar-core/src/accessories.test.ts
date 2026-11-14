import { describe, expect, it } from 'vitest'
import {
  ACCESSORIES,
  accessoryMarkup,
  accessoryOrNull,
  renderFrame,
  type AccessoryId
} from './index.js'
import { BotEngine } from './bot/engine.js'
import { EXPRESSION_BY_ID } from './bot/expressions.js'
import { RAYON } from './bot/repere.js'
import { SHAPE_BY_ID } from './bot/skins.js'
import type { StateId } from './bot/states.js'

function frame(shape: string, state: StateId, t: number) {
  const engine = new BotEngine(
    RAYON,
    state,
    SHAPE_BY_ID.get(shape)?.radii ?? null,
    EXPRESSION_BY_ID.get('neutre') ?? null
  )
  return engine.sample(t)
}

describe('accessories', () => {
  it('the catalogue holds the ten ids, the three new ones included', () => {
    const ids = ACCESSORIES.map((a) => a.id)
    expect(ids).toHaveLength(10)
    expect(ids).toContain('headphones')
    expect(ids).toContain('halo')
    expect(ids).toContain('antenna')
  })

  it('validates ids strictly', () => {
    expect(accessoryOrNull('crown')).toBe('crown')
    expect(accessoryOrNull('headphones')).toBe('headphones')
    expect(accessoryOrNull('bogus')).toBeNull()
    expect(accessoryOrNull(null)).toBeNull()
    expect(accessoryOrNull(undefined)).toBeNull()
  })

  it('every accessory renders without NaN on real frames, across shapes and instants', () => {
    for (const { id } of ACCESSORIES) {
      for (const shape of ['cercle', 'etoile', 'goutte', 'carre']) {
        for (const t of [0, 0.7, 1.9]) {
          const svg = renderFrame(frame(shape, 'idle', t), {
            accessory: id,
            eyesVisible: true
          })
          expect(svg).not.toContain('NaN')
          expect(svg).not.toContain('undefined')
        }
      }
    }
  })

  it('hat-class accessories produce markup; none produces nothing extra', () => {
    const f = frame('cercle', 'idle', 0.4)
    for (const id of ['cap', 'crown', 'party', 'bow', 'headphones', 'halo', 'antenna'] as AccessoryId[]) {
      expect(accessoryMarkup(f, id, { eyesVisible: true }).length).toBeGreaterThan(10)
    }
    expect(accessoryMarkup(f, 'none', { eyesVisible: true })).toBe('')
    expect(renderFrame(f, { accessory: 'none' })).toBe(renderFrame(f))
  })

  it('glasses obey the rest-face gate the caller passes', () => {
    const f = frame('cercle', 'galaxy', 0.4)
    expect(accessoryMarkup(f, 'glasses', { eyesVisible: false })).toBe('')
    expect(accessoryMarkup(f, 'shades', { eyesVisible: false })).toBe('')
    expect(accessoryMarkup(f, 'glasses', { eyesVisible: true }).length).toBeGreaterThan(10)
    // Through the renderer: gated off, the frame is byte-identical to bare.
    expect(renderFrame(f, { accessory: 'glasses', eyesVisible: false })).toBe(renderFrame(f))
    expect(renderFrame(f, { accessory: 'glasses', eyesVisible: true })).not.toBe(renderFrame(f))
  })
})
