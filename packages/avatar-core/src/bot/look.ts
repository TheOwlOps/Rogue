import type { Look } from './engine.js'
import { clamp } from './math.js'

/**
 * Pointer-follow gaze for the SDK player: where the head turns when a
 * visitor moves their cursor around an embedded avatar.
 *
 * The playground studio has its own richer script (a full turn toward the
 * settings panel, a spin on arrival — see `apps/playground/src/ui/gaze.ts`);
 * this is the portable version for chat apps and demo pages: the head aims
 * at the pointer with amplitudes CHOSEN to stay well inside the sphere —
 * wide enough to read clearly against the resting drift (±7° yaw, ±5.5°
 * pitch), narrow enough that no eye ever slips behind the limb.
 */

/** Horizontal head travel, degrees, for a pointer at the window's edge. */
export const LOOK_YAW_MAX = 16
/** Vertical head travel, degrees, for a pointer at the window's edge. */
export const LOOK_PITCH_MAX = 13
/**
 * Height the gaze holds with the pointer dead centre: slightly above the
 * equator, which reads as attentive rather than vacant. ABSOLUTE, like in
 * the studio rule — a relative height would inherit each expression's own
 * resting pitch and the eyes would drop the moment the face changes.
 */
export const LOOK_PITCH = 10

/**
 * The look target for a pointer at (`nx`, `ny`) relative to the avatar's
 * centre, each in [-1, 1] (right / down positive, screen sense). Pure and
 * total: non-finite inputs degrade to centre instead of poisoning the
 * engine with a NaN it would keep forever.
 */
export function pointerLook(nx: number, ny: number): Look {
  const x = Number.isFinite(nx) ? clamp(nx, -1, 1) : 0
  const y = Number.isFinite(ny) ? clamp(ny, -1, 1) : 0
  return {
    yaw: x * LOOK_YAW_MAX,
    // positive pitch looks UP, screen y grows downward — hence the minus
    pitch: LOOK_PITCH - y * LOOK_PITCH_MAX,
    mix: 1,
    spin: 0,
    // the pointer is the interesting thing in the room: no resting drift
    wander: 0
  }
}
