import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/bot/engine'
import {
  ACCESSORY_IDS,
  accessoryMarkup,
  accessoryOrNull,
  eyeCenters,
  pathBounds
} from './accessories'

const frame = (state: 'idle' | 'orbit' = 'idle', t = 1) =>
  new BotEngine(100, state).sample(t)

describe('accessories', () => {
  it('bounds follow the real silhouette', () => {
    const b = pathBounds(frame().bodyPath)!
    expect(b).not.toBeNull()
    // the resting body is the unit sphere: diameter ~200, centred on 0
    expect(b.width).toBeGreaterThan(190)
    expect(b.width).toBeLessThan(210)
    expect(Math.abs(b.cx)).toBeLessThan(2)
    expect(b.minY).toBeLessThan(-90)
  })

  it('returns no bounds for a path without coordinates', () => {
    expect(pathBounds('M Z')).toBeNull()
  })

  it('eye centres come from the eye matrices', () => {
    const centers = eyeCenters(frame())
    expect(centers).toHaveLength(2)
    for (const c of centers) {
      expect(Number.isFinite(c.x)).toBe(true)
      expect(Number.isFinite(c.y)).toBe(true)
    }
    // two distinct eyes, side by side
    expect(Math.abs(centers[0]!.x - centers[1]!.x)).toBeGreaterThan(10)
  })

  it('every hat renders over an idle frame, none renders nothing', () => {
    for (const id of ACCESSORY_IDS) {
      const svg = accessoryMarkup(frame(), id, { eyesVisible: true })
      if (id === 'none') expect(svg).toBe('')
      else {
        expect(svg, id).not.toBe('')
        expect(svg, id).not.toContain('NaN')
        expect(svg, id).not.toContain('undefined')
      }
    }
  })

  it('glasses and shades only exist while a rest face shows', () => {
    expect(accessoryMarkup(frame(), 'glasses', { eyesVisible: false })).toBe('')
    expect(accessoryMarkup(frame(), 'shades', { eyesVisible: false })).toBe('')
    expect(accessoryMarkup(frame(), 'glasses', { eyesVisible: true })).toContain('<circle')
    expect(accessoryMarkup(frame(), 'shades', { eyesVisible: true })).toContain('<rect')
  })

  it('validates ids coming from share links', () => {
    expect(accessoryOrNull('crown')).toBe('crown')
    expect(accessoryOrNull('none')).toBe('none')
    expect(accessoryOrNull('laser-eyes')).toBeNull()
    expect(accessoryOrNull(undefined)).toBeNull()
    expect(accessoryOrNull('')).toBeNull()
  })
})
