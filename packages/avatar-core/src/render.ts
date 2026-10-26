/**
 * SVG renderer for the avatar engine — a faithful, framework-free port of the
 * layering the original Vue component (`TheOwlOpsBot.vue`) applies to a `BotFrame`:
 *
 *   1. back halves of orbit arcs (occluded by the body)
 *   2. burst particles, when the state says they pass behind the body
 *   3. the body: an opaque `paper` silhouette + a full-canvas rect of body
 *      colour, masked by the silhouette minus the eyes (the eyes are real
 *      holes pierced in the body, not white shapes on top)
 *   4. particles in front, when they don't pass behind
 *   5. the notification dot
 *   6. front halves of orbit arcs
 *
 * Everything here is a pure string builder: give it a frame from
 * `BotEngine.sample(t)`, get SVG markup back. Use `renderFrame` to embed the
 * avatar inside your own `<svg>`, or `frameToSvg` for a complete standalone
 * `<svg>` element as a string.
 */
import { NOTIF_BLUE, type DotRender } from './bot/decor.js'
import type { BotFrame } from './bot/engine.js'
import { RAYON, DEMI_VIEWBOX } from './bot/repere.js'
import { mixHex } from './bot/skins.js'

export interface RenderOptions {
  /** Body colour (hex). Default: the catalogue ink `#0a0a0c`. */
  ink?: string
  /**
   * Background colour the eyes "see through" to, and that depth-faded
   * particles blend toward. Should match the surface behind the avatar.
   * Default `#f9f9f9`.
   */
  paper?: string
  /**
   * Prefix for mask/gradient ids, so several avatars can live on one page.
   * Default `rogue-avatar`.
   */
  uid?: string
  /** Pixel size of the standalone `<svg>` (width = height). Default 320. */
  size?: number
  /** Accessible label for the standalone `<svg>`. Default `bot avatar`. */
  label?: string
}

const n = (v: number): string => {
  // Keep the markup compact: engine numbers are already rounded to 2 decimals
  // upstream for paths; raw floats (dot coords) get the same treatment here.
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

function dotMarkup(dot: DotRender, ink: string, paper: string): string {
  const fill = dot.color ?? (dot.depth === undefined ? ink : mixHex(paper, ink, dot.depth))
  if (dot.d) {
    return `<path d="${dot.d}" transform="translate(${n(dot.x)} ${n(dot.y)}) rotate(${n(dot.rot ?? 0)}) scale(${RAYON})" fill="${fill}" opacity="${n(dot.opacity)}"/>`
  }
  return `<circle cx="${n(dot.x)}" cy="${n(dot.y)}" r="${n(dot.r)}" fill="${fill}" opacity="${n(dot.opacity)}"/>`
}

/** The inner markup of the avatar `<svg>` for one sampled frame. */
export function renderFrame(frame: BotFrame, opts: RenderOptions = {}): string {
  const ink = opts.ink ?? '#0a0a0c'
  const paper = opts.paper ?? '#f9f9f9'
  const uid = opts.uid ?? 'rogue-avatar'
  const VB = DEMI_VIEWBOX
  const maskId = `${uid}-mask`

  const defs: string[] = []
  let mask = `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${-VB}" y="${-VB}" width="${VB * 2}" height="${VB * 2}">`
  mask += `<path d="${frame.bodyPath}" fill="#fff"/>`
  for (const eye of frame.eyes) {
    mask += `<path d="${eye.d}" transform="${eye.matrix}" opacity="${n(eye.alpha)}" fill="#000"/>`
  }
  if (frame.notch) {
    mask += `<circle cx="${n(frame.notch.x)}" cy="${n(frame.notch.y)}" r="${n(frame.notch.r)}" fill="#000"/>`
  }
  mask += '</mask>'
  defs.push(mask)

  for (const arc of frame.arcs) {
    const colors = arc.grad.stops
    const last = colors.length - 1
    const stops: string = colors
      .map((c, i) => `<stop offset="${last > 0 ? n(i / last) : 0}" stop-color="${c}"/>`)
      .join('')
    defs.push(
      `<linearGradient id="${uid}-${arc.id}" gradientUnits="userSpaceOnUse" x1="${n(arc.grad.x1)}" y1="${n(arc.grad.y1)}" x2="${n(arc.grad.x2)}" y2="${n(arc.grad.y2)}">${stops}</linearGradient>`
    )
  }

  const arcsBack = frame.arcs
    .map(
      (arc) =>
        `<path d="${arc.back}" stroke="url(#${uid}-${arc.id})" stroke-width="${n(arc.width)}" opacity="${n(arc.opacity)}"/>`
    )
    .join('')
  const arcsFront = frame.arcs
    .map(
      (arc) =>
        `<path d="${arc.front}" stroke="url(#${uid}-${arc.id})" stroke-width="${n(arc.width)}" opacity="${n(arc.opacity)}"/>`
    )
    .join('')
  const dots = frame.dots.map((d) => dotMarkup(d, ink, paper)).join('')

  let out = `<defs>${defs.join('')}</defs>`
  out += `<g fill="none" stroke-linecap="round">${arcsBack}</g>`
  if (frame.dotsBehind) out += `<g>${dots}</g>`
  out += `<g opacity="${n(frame.bodyAlpha)}"><path d="${frame.bodyPath}" fill="${paper}"/><g mask="url(#${maskId})"><rect x="${-VB}" y="${-VB}" width="${VB * 2}" height="${VB * 2}" fill="${ink}"/></g></g>`
  if (!frame.dotsBehind) out += `<g>${dots}</g>`
  if (frame.notif) {
    out += `<circle cx="${n(frame.notif.x)}" cy="${n(frame.notif.y)}" r="${n(frame.notif.r)}" fill="${NOTIF_BLUE}"/>`
  }
  out += `<g fill="none" stroke-linecap="round">${arcsFront}</g>`
  return out
}

/** A complete standalone `<svg>` element (as a string) for one sampled frame. */
export function frameToSvg(frame: BotFrame, opts: RenderOptions = {}): string {
  const size = opts.size ?? 320
  const VB = DEMI_VIEWBOX
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="${-VB} ${-VB} ${VB * 2} ${VB * 2}" role="img" aria-label="${opts.label ?? 'bot avatar'}">` +
    renderFrame(frame, opts) +
    '</svg>'
  )
}
