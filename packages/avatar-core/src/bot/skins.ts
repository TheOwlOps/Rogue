import { PROFILE_SAMPLES } from './profiles.js'
import {
  hullOfCircles,
  profileFromPolygon,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile
} from './shape.js'

/**
 * Formes et couleurs proposees par le personnalisateur du bot.
 *
 * A la difference des silhouettes d'animation (`profiles.ts`), celles-ci ne sont
 * PAS relevees sur la video : elles sont construites analytiquement d'apres la
 * grille du personnalisateur d'origine. Deux sources distinctes, donc, et c'est
 * volontaire — les etats animes doivent rester fideles a la video, les formes de
 * base sont un choix d'utilisateur.
 */

/**
 * Les identifiants sont enumeres plutot que deduits du tableau : c'est ce qui
 * permet a la couche i18n de verifier A LA COMPILATION que chaque forme a bien
 * sa traduction dans les trois langues (`t(\`shapes.${id}\`)` ne compile que si
 * la cle existe). Un `as const` sur le tableau aurait le meme effet mais
 * rendrait `radii` en lecture seule, alors que le moteur le passe tel quel.
 */
export type ShapeId =
  | 'etoile'
  | 'carre'
  | 'diamant'
  | 'pentagone'
  | 'octogone'
  | 'coeur'
  | 'soleil'
  | 'fleur'
  | 'ovale'
  | 'pilule'
  | 'poire'
  | 'blob'
  | 'cercle'
  | 'galet'
  | 'squircle'
  | 'capsule'
  | 'triangle'
  | 'hexagone'
  | 'nuage'
  | 'goutte'

export interface BotShape {
  id: ShapeId
  radii: number[]
}

/** Ramene le rayon maximal a `max` pour que toutes les formes pesent pareil a l'oeil. */
function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2)

/** Galet : cercle deforme par deux harmoniques basses, donc irregulier mais lisse. */
const pebble = normalize(
  ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
  1.02
)

/** Nuage : union de bosses, large en bas, deux lobes en haut. */
const cloud = normalize(
  unionOfCirclesProfile([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 }
  ]),
  1.02
)

/** Goutte : gros disque en bas, pointe effilee en haut. */
const droplet = normalize(
  profileFromPolygon(hullOfCircles(0, 0.28, 0.66, 0, -0.96, 0.05), 0, 0),
  1.04
)

/** Capsule couchee : enveloppe de deux disques cote a cote. */
const capsule = profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62), 0, 0)


/* ------------------------------------------- pack d'extension (v0.2) */
/*
 * Douze formes de plus, construites comme les huit d'origine : analytiquement,
 * jamais relevees sur la video, et toutes dans l'enveloppe sure du moteur —
 * rayon minimal >= 0,55 et maximal <= 1,35, pour que les yeux restent dedans
 * sans que la correction d'`eyefit` ait a forcer.
 */

/** Etoile douce a cinq branches : polygone alterne rayon externe / interne. */
function starProfile(points: number, outer: number, inner: number): number[] {
  const verts = Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2
    const r = i % 2 === 0 ? outer : inner
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
  return profileFromPolygon(verts, 0, 0)
}

/** Coeur dodu : union de deux lobes et d'un triangle pointe en bas, max par angle. */
const heart = (() => {
  const lobes = unionOfCirclesProfile([
    { x: -0.34, y: -0.26, r: 0.44 },
    { x: 0.34, y: -0.26, r: 0.44 }
  ])
  const pointe = profileFromPolygon(
    [
      { x: -0.78, y: -0.08 },
      { x: 0.78, y: -0.08 },
      { x: 0, y: 1.02 }
    ],
    0,
    0
  )
  return normalize(lobes.map((r, i) => Math.max(r, pointe[i]!)), 1.06)
})()

/** Soleil : disque ondule a douze rayons courts. */
const sun = normalize(ANGLES.map((a) => 1 + 0.09 * Math.cos(12 * a)), 1.05)

/** Fleur : six petales par harmonique, creux peu marques. */
const flower = normalize(ANGLES.map((a) => 1 + 0.12 * Math.cos(6 * a + 0.4)), 1.06)

/** Blob organique : deux harmoniques basses de phases croisees, comme le galet mais plus libre. */
const blob = normalize(
  ANGLES.map((a) => 1 + 0.09 * Math.cos(3 * a + 1.2) + 0.055 * Math.cos(5 * a + 3.4)),
  1.04
)

/** Poire : gros disque bas surmonte d'un petit, union exacte. */
const pear = normalize(
  unionOfCirclesProfile([
    { x: 0, y: 0.3, r: 0.7 },
    { x: 0, y: -0.42, r: 0.46 }
  ]),
  1.03
)

/** Pilule verticale : enveloppe de deux disques empiles. */
const pill = profileFromPolygon(hullOfCircles(0, -0.36, 0.6, 0, 0.36, 0.6), 0, 0)

export const SHAPES: BotShape[] = [
  { id: 'cercle', radii: new Array(PROFILE_SAMPLES).fill(1) },
  { id: 'galet', radii: pebble },
  // 1.15 et pas 1.02 : sur une superellipse le rayon maximal est la diagonale,
  // donc normaliser dessus donne une forme qui parait plus petite que le cercle.
  { id: 'squircle', radii: normalize(superellipseProfile(4.2), 1.15) },
  { id: 'capsule', radii: capsule },
  // -90deg : un sommet vers le haut de l'ecran (y est oriente vers le bas)
  { id: 'triangle', radii: regularPolygonProfile(3, 1.12, 0.34, -90) },
  // 0deg : sommets a gauche et a droite, donc aretes du haut et du bas plates
  { id: 'hexagone', radii: regularPolygonProfile(6, 1.04, 0.26, 0) },
  { id: 'nuage', radii: cloud },
  { id: 'goutte', radii: droplet },
  { id: 'etoile', radii: starProfile(5, 1.1, 0.84) },
  { id: 'carre', radii: normalize(superellipseProfile(8), 1.16) },
  { id: 'diamant', radii: normalize(superellipseProfile(1.35), 1.07) },
  { id: 'pentagone', radii: regularPolygonProfile(5, 1.09, 0.24, -90) },
  { id: 'octogone', radii: regularPolygonProfile(8, 1.06, 0.2, 0) },
  { id: 'coeur', radii: heart },
  { id: 'soleil', radii: sun },
  { id: 'fleur', radii: flower },
  { id: 'ovale', radii: normalize(superellipseProfile(2, 1.18, 0.88), 1.18) },
  { id: 'pilule', radii: pill },
  { id: 'poire', radii: pear },
  { id: 'blob', radii: blob }
]

// Map indexee par `string` et non par `ShapeId` : les appelants interrogent avec
// une valeur relue du localStorage ou d'une prop, donc non validee.
export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'cercle'

export type ColorId =
  | 'corail'
  | 'saumon'
  | 'peche'
  | 'menthe'
  | 'ciel'
  | 'lavande'
  | 'lilas'
  | 'fuchsia'
  | 'bordeaux'
  | 'olive'
  | 'kaki'
  | 'sable'
  | 'chocolat'
  | 'ardoise'
  | 'marine'
  | 'cyan'
  | 'magenta'
  | 'citron'
  | 'prune'
  | 'argent'
  | 'or'
  | 'cuivre'
  | 'emeraude'
  | 'saphir'
  | 'encre'
  | 'creme'
  | 'brun'
  | 'rouge'
  | 'orange'
  | 'ambre'
  | 'vert'
  | 'turquoise'
  | 'bleu'
  | 'violet'
  | 'rose'
  | 'gris'

export interface BotColor {
  id: ColorId
  hex: string
}

/** Palette du personnalisateur d'origine. */
export const COLORS: BotColor[] = [
  { id: 'encre', hex: '#0a0a0c' },
  { id: 'brun', hex: '#8b5e3c' },
  { id: 'rouge', hex: '#e8483f' },
  { id: 'orange', hex: '#f08a24' },
  { id: 'ambre', hex: '#f0b429' },
  { id: 'vert', hex: '#3ecf8e' },
  { id: 'turquoise', hex: '#2fbfa0' },
  { id: 'bleu', hex: '#3b93f0' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'rose', hex: '#e152b0' },
  { id: 'gris', hex: '#a3a3a3' },
  { id: 'creme', hex: '#f1efe9' },
  { id: 'corail', hex: '#ff6f61' },
  { id: 'saumon', hex: '#fa8072' },
  { id: 'peche', hex: '#f2a65a' },
  { id: 'menthe', hex: '#3ddc97' },
  { id: 'ciel', hex: '#6ec6e8' },
  { id: 'lavande', hex: '#b39ddb' },
  { id: 'lilas', hex: '#c86dd7' },
  { id: 'fuchsia', hex: '#d6339c' },
  { id: 'bordeaux', hex: '#8e2434' },
  { id: 'olive', hex: '#7d8c46' },
  { id: 'kaki', hex: '#a8a24a' },
  { id: 'sable', hex: '#d9b382' },
  { id: 'chocolat', hex: '#5c3a21' },
  { id: 'ardoise', hex: '#64748b' },
  { id: 'marine', hex: '#25407a' },
  { id: 'cyan', hex: '#22c3e6' },
  { id: 'magenta', hex: '#e0218a' },
  { id: 'citron', hex: '#b8cc18' },
  { id: 'prune', hex: '#6c3483' },
  { id: 'argent', hex: '#c3cbd2' },
  { id: 'or', hex: '#c9a227' },
  { id: 'cuivre', hex: '#b87333' },
  { id: 'emeraude', hex: '#0fa36b' },
  { id: 'saphir', hex: '#2456c8' }
]

export const COLOR_BY_ID = new Map<string, BotColor>(COLORS.map((c) => [c.id, c]))
export const DEFAULT_COLOR = 'encre'

/** Melange deux couleurs hex. Sert a la brume de profondeur des particules. */
export function mixHex(from: string, to: string, t: number): string {
  const parse = (h: string) => {
    const v = parseInt(h.slice(1), 16)
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
  }
  const a = parse(from)
  const b = parse(to)
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t))
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`
}
