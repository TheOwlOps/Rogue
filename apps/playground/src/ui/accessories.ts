import type { BotFrame } from '@/bot/engine'

/**
 * Accessories: the layer the engine does NOT know about.
 *
 * The engine owns the body, the eyes and the particles — an accessory is
 * pure decoration drawn over a finished frame, so it lives here, in the
 * studio, as a pure function of the frame. Two anchors, both read off the
 * frame itself so they track every morph for free:
 *
 * - hats sit on the body's real silhouette (the bounds of `bodyPath`);
 * - glasses sit on the eyes' real centres (the translation of each eye
 *   matrix), and only exist while a rest face is showing — during an
 *   expressive state the eyes are the animation, and chasing them with a
 *   pair of glasses would just look broken.
 */

export type AccessoryId = 'none' | 'cap' | 'crown' | 'party' | 'bow' | 'glasses' | 'shades'

export const ACCESSORIES: { id: AccessoryId }[] = [
  { id: 'none' },
  { id: 'cap' },
  { id: 'crown' },
  { id: 'party' },
  { id: 'bow' },
  { id: 'glasses' },
  { id: 'shades' }
]

export const ACCESSORY_IDS: AccessoryId[] = ACCESSORIES.map((a) => a.id)

const isAccessory = (v: string): v is AccessoryId => (ACCESSORY_IDS as string[]).includes(v)

export function accessoryOrNull(v: string | undefined | null): AccessoryId | null {
  return v != null && isAccessory(v) ? v : null
}

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  cx: number
  width: number
}

/** Bounds of an SVG path made of absolute coordinates (the body silhouette). */
export function pathBounds(d: string): Bounds | null {
  const nums = d.match(/-?\d+\.?\d*(?:e-?\d+)?/g)?.map(Number) ?? []
  if (nums.length < 4) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!
    const y = nums[i + 1]!
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, width: maxX - minX }
}

/** Centres of the rendered eyes, from the translation part of each matrix. */
export function eyeCenters(frame: BotFrame): { x: number; y: number }[] {
  return frame.eyes.map((eye) => {
    const n = eye.matrix.match(/-?\d+\.?\d*(?:e-?\d+)?/g)?.map(Number) ?? []
    return { x: n[4] ?? 0, y: n[5] ?? 0 }
  })
}

const r1 = (v: number): number => Math.round(v * 10) / 10
const DARK = '#17171c'

function cap(b: Bounds): string {
  const w2 = b.width * 0.36
  const baseY = b.minY + b.width * 0.13
  const top = baseY - w2 * 0.78
  return (
    `<path d="M ${r1(b.cx - w2)} ${r1(baseY)} A ${r1(w2)} ${r1(w2 * 0.78)} 0 0 1 ${r1(b.cx + w2)} ${r1(baseY)} Z" fill="#e2452f"/>` +
    `<ellipse cx="${r1(b.cx)}" cy="${r1(baseY + 1)}" rx="${r1(w2 * 1.04)}" ry="${r1(w2 * 0.26)}" fill="#b93322"/>` +
    `<circle cx="${r1(b.cx)}" cy="${r1(top + 2)}" r="${r1(b.width * 0.035)}" fill="#b93322"/>`
  )
}

function crown(b: Bounds): string {
  const half = b.width * 0.3
  const base = b.minY + b.width * 0.12
  const peak = b.minY - b.width * 0.13
  const mid = (base + peak) / 2
  const x0 = b.cx - half
  const step = (half * 2) / 3
  const pts = [
    `${r1(x0)},${r1(base)}`,
    `${r1(x0)},${r1(peak)}`,
    `${r1(x0 + step * 0.5)},${r1(mid)}`,
    `${r1(x0 + step)},${r1(peak)}`,
    `${r1(x0 + step * 1.5)},${r1(mid)}`,
    `${r1(x0 + step * 2)},${r1(peak)}`,
    `${r1(x0 + step * 2.5)},${r1(mid)}`,
    `${r1(x0 + step * 3)},${r1(peak)}`,
    `${r1(x0 + step * 3)},${r1(base)}`
  ].join(' ')
  return (
    `<polygon points="${pts}" fill="#f2b01e"/>` +
    `<circle cx="${r1(x0 + step * 0.5)}" cy="${r1(base - b.width * 0.03)}" r="${r1(b.width * 0.028)}" fill="#e2452f"/>` +
    `<circle cx="${r1(b.cx)}" cy="${r1(base - b.width * 0.03)}" r="${r1(b.width * 0.028)}" fill="#2f7de1"/>` +
    `<circle cx="${r1(x0 + step * 2.5)}" cy="${r1(base - b.width * 0.03)}" r="${r1(b.width * 0.028)}" fill="#e2452f"/>`
  )
}

function party(b: Bounds): string {
  const half = b.width * 0.19
  const base = b.minY + b.width * 0.14
  const apexX = b.cx + b.width * 0.07
  const apexY = b.minY - b.width * 0.3
  return (
    `<polygon points="${r1(b.cx - half)},${r1(base)} ${r1(apexX)},${r1(apexY)} ${r1(b.cx + half)},${r1(base)}" fill="#7c5cd6"/>` +
    `<polygon points="${r1(b.cx - half * 0.55)},${r1(base - b.width * 0.09)} ${r1(b.cx + half * 0.15)},${r1(base - b.width * 0.09)} ${r1(b.cx + half * 0.62)},${r1(base)} ${r1(b.cx - half * 0.1)},${r1(base)}" fill="#ffd23f" opacity="0.85"/>` +
    `<circle cx="${r1(apexX)}" cy="${r1(apexY)}" r="${r1(b.width * 0.05)}" fill="#ffd23f"/>`
  )
}

function bow(b: Bounds): string {
  const cx = b.cx + b.width * 0.3
  const cy = b.minY + b.width * 0.05
  const w = b.width * 0.17
  const h = b.width * 0.1
  return (
    `<g transform="rotate(-14 ${r1(cx)} ${r1(cy)})">` +
    `<polygon points="${r1(cx)},${r1(cy)} ${r1(cx - w)},${r1(cy - h)} ${r1(cx - w)},${r1(cy + h)}" fill="#ef6aa5"/>` +
    `<polygon points="${r1(cx)},${r1(cy)} ${r1(cx + w)},${r1(cy - h)} ${r1(cx + w)},${r1(cy + h)}" fill="#ef6aa5"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(b.width * 0.045)}" fill="#d94f8c"/>` +
    `</g>`
  )
}

function glasses(frame: BotFrame, shades: boolean): string {
  const centers = eyeCenters(frame)
  if (centers.length < 2) return ''
  const [a, z] = centers as [{ x: number; y: number }, { x: number; y: number }]
  const dist = Math.hypot(z.x - a.x, z.y - a.y)
  const lensR = Math.min(30, Math.max(9, dist * 0.36))
  const y = (a.y + z.y) / 2
  if (shades) {
    const w = lensR * 2.05
    const h = lensR * 1.3
    const lens = (c: { x: number; y: number }) =>
      `<rect x="${r1(c.x - w / 2)}" y="${r1(y - h / 2)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h * 0.42)}" fill="${DARK}"/>` +
      `<path d="M ${r1(c.x - w * 0.28)} ${r1(y + h * 0.18)} L ${r1(c.x + w * 0.05)} ${r1(y - h * 0.22)}" stroke="#ffffff" stroke-width="${r1(lensR * 0.13)}" stroke-linecap="round" opacity="0.5"/>`
    return (
      lens(a) +
      lens(z) +
      `<rect x="${r1(a.x + w / 2 - 2)}" y="${r1(y - lensR * 0.18)}" width="${r1(z.x - w / 2 + 2 - (a.x + w / 2 - 2))}" height="${r1(lensR * 0.36)}" fill="${DARK}"/>`
    )
  }
  const lens = (c: { x: number; y: number }) =>
    `<circle cx="${r1(c.x)}" cy="${r1(y)}" r="${r1(lensR)}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.55"/>` +
    `<circle cx="${r1(c.x)}" cy="${r1(y)}" r="${r1(lensR)}" fill="none" stroke="${DARK}" stroke-width="3"/>`
  return (
    lens(a) +
    lens(z) +
    `<path d="M ${r1(a.x + lensR)} ${r1(y - lensR * 0.25)} Q ${r1((a.x + z.x) / 2)} ${r1(y - lensR * 0.7)} ${r1(z.x - lensR)} ${r1(y - lensR * 0.25)}" fill="none" stroke="${DARK}" stroke-width="3"/>`
  )
}

/**
 * SVG markup for one accessory over one frame (`''` for none, or when the
 * anchors the accessory needs are not on this frame). `eyesVisible` is the
 * caller's rest-face check: glasses only exist while a rest face shows.
 */
export function accessoryMarkup(
  frame: BotFrame,
  id: AccessoryId,
  opts: { eyesVisible: boolean }
): string {
  if (id === 'none') return ''
  if (id === 'glasses' || id === 'shades') {
    return opts.eyesVisible ? glasses(frame, id === 'shades') : ''
  }
  const b = pathBounds(frame.bodyPath)
  if (!b || b.width <= 0) return ''
  switch (id) {
    case 'cap':
      return cap(b)
    case 'crown':
      return crown(b)
    case 'party':
      return party(b)
    case 'bow':
      return bow(b)
    default:
      return ''
  }
}
