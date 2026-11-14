import { describe, expect, it } from 'vitest'
import { LOOK_PITCH, LOOK_PITCH_MAX, LOOK_YAW_MAX, pointerLook } from './look.js'

describe('pointerLook', () => {
  it('aims at the pointer, centre holding the attentive height', () => {
    expect(pointerLook(0, 0)).toEqual({
      yaw: 0,
      pitch: LOOK_PITCH,
      mix: 1,
      spin: 0,
      wander: 0
    })
    expect(pointerLook(1, 0).yaw).toBe(LOOK_YAW_MAX)
    expect(pointerLook(-1, 0).yaw).toBe(-LOOK_YAW_MAX)
    // screen y grows downward, pitch grows upward: pointer low = look down
    expect(pointerLook(0, 1).pitch).toBe(LOOK_PITCH - LOOK_PITCH_MAX)
    expect(pointerLook(0, -1).pitch).toBe(LOOK_PITCH + LOOK_PITCH_MAX)
  })

  it('clamps beyond the window edge instead of over-rotating', () => {
    expect(pointerLook(4, -9)).toEqual(pointerLook(1, -1))
  })

  it('degrades non-finite input to centre rather than NaN', () => {
    const look = pointerLook(Number.NaN, Number.POSITIVE_INFINITY)
    expect(look).toEqual(pointerLook(0, 0))
    for (const v of Object.values(look)) expect(Number.isFinite(v)).toBe(true)
  })
})
