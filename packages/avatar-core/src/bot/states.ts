import {
  COMET_DOT,
  COMET_RIBBONS,
  DOT_PEAK,
  DOT_R,
  DOT_X,
  NOTIF_ANGLE,
  NOTIF_DIST,
  NOTIF_MARGIN,
  NOTIF_POP,
  NOTIF_R,
  RINGS,
  SWOOSH,
  particles,
  type ArcSeed,
  type ArcSpec,
  type DotRender
} from './decor.js'
import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE, type HeadGaze } from './face.js'
import { TAU, clamp, easings, lerp } from './math.js'
import { PROFILE_SAMPLES } from './profiles.js'
import {
  circle,
  hullOfCircles,
  polyPath,
  profileFromPolygon,
  regularPolygonProfile,
  silhouette,
  superellipseProfile,
  unionOfCirclesProfile,
  type Silhouette
} from './shape.js'

export interface EyeCfg {
  /** largeur locale (axe court de la gelule), en unites de rayon de boule */
  w: number
  /** hauteur locale (axe long) */
  h: number
  /** 1 = ouvert, 0 = ferme */
  open: number
  /**
   * Inclinaison propre de la gelule, en degres, positif = le haut part a
   * droite. Appliquee APRES le repere tangent de la sphere. Sans elle, les deux
   * yeux penchent forcement du meme cote (le roulis de tete) et la colere comme
   * la tristesse, qui demandent des inclinaisons en miroir, sont hors de portee.
   */
  tilt?: number
}

export interface Pose {
  /** silhouette du corps, en unites de rayon de boule */
  sil: Silhouette
  /** decalage global du corps ET des yeux */
  offX: number
  offY: number
  gaze: HeadGaze
  /** demi-ecart des yeux sur la sphere, en degres */
  split: number
  /** [oeil interieur, oeil exterieur] */
  eyes: [EyeCfg, EyeCfg]
  /** opacite des yeux : sert aux etats sans visage */
  eyeAlpha: number
  bodyAlpha: number
  dots: DotRender[]
  arcs: ArcSpec[]
  notif: { x: number; y: number; r: number; notch: number } | null
  /** true = le decor passe derriere le corps (particules de l'eclatement) */
  dotsBehind: boolean
}

const pair = (w: number, h: number): [EyeCfg, EyeCfg] => [
  { w, h, open: 1 },
  { w, h, open: 1 }
]

function base(over: Partial<Pose> = {}): Pose {
  return {
    sil: circle(1),
    offX: 0,
    offY: 0,
    gaze: { ...REST_GAZE },
    split: EYE_SPLIT,
    eyes: pair(EYE_W, EYE_H),
    eyeAlpha: 1,
    bodyAlpha: 1,
    dots: [],
    arcs: [],
    notif: null,
    dotsBehind: false,
    ...over
  }
}

/* --------------------------------------------------- formes non radiales */

/**
 * Barre du "!" vertical : enveloppe convexe de deux cercles.
 * Mesure : cercle haut (0, -0.505) r 0.132, cercle bas (0, +0.130) r 0.075,
 * flancs rectilignes. Elle est donc tronconique (rapport haut/bas 1.76).
 */
const BAR_UPRIGHT_CY = -0.1875
const BAR_UPRIGHT = profileFromPolygon(
  hullOfCircles(0, -0.505, 0.132, 0, 0.13, 0.075),
  0,
  BAR_UPRIGHT_CY
)

/** Barre du "!" penche : capsule pure (largeur constante 0.269, longueur 0.776). */
const BAR_ITALIC = profileFromPolygon(hullOfCircles(0, -0.2535, 0.1345, 0, 0.2535, 0.1345), 0, 0)

const barUpright = (pose: Partial<Silhouette> = {}): Silhouette => ({
  radii: [...BAR_UPRIGHT],
  rot: 0,
  cx: 0,
  cy: BAR_UPRIGHT_CY,
  sx: 1,
  sy: 1,
  ...pose
})

const barItalic = (pose: Partial<Silhouette> = {}): Silhouette => ({
  radii: [...BAR_ITALIC],
  rot: 0,
  cx: 0,
  cy: 0,
  sx: 1,
  sy: 1,
  ...pose
})

/**
 * Le point du "!" penche n'est pas un disque : c'est une goutte, bout rond
 * (r 0.118) du cote de la barre et pointe effilee a l'oppose, longueur 0.300
 * dans l'axe du glyphe. Centree sur le barycentre du bout rond.
 */
const TEAR = polyPath(hullOfCircles(0, 0, 0.118, 0, 0.172, 0.012))

/**
 * Le triangle ne tourne pas sur lui-meme : son centre decrit un cercle de
 * rayon 0.213 autour de l'origine (mesure). C'est ce decalage qui donne
 * l'impression qu'il bascule au lieu de pivoter sur place.
 */
const TRI_ORBIT = 0.213

function spinningTriangle(rot: number): Silhouette {
  return silhouette('triangle', {
    rot,
    cx: -TRI_ORBIT * Math.sin(rot),
    cy: TRI_ORBIT * Math.cos(rot)
  })
}

/* ------------------------------------------------------------------ etats */

export type StateId =
  | 'idle'
  | 'thinking'
  | 'wink'
  | 'wide'
  | 'alert'
  | 'notify'
  | 'exclaim'
  | 'sleep'
  | 'egg'
  | 'hexagon'
  | 'play'
  | 'orbit'
  | 'burst'
  | 'comet'
  | 'bounce'
  | 'dance'
  | 'spin'
  | 'flip'
  | 'wiggle'
  | 'swing'
  | 'hop'
  | 'float'
  | 'drift'
  | 'roll'
  | 'star'
  | 'heart'
  | 'diamond'
  | 'square'
  | 'pentagon'
  | 'octagon'
  | 'flower'
  | 'sun'
  | 'blob'
  | 'wave'
  | 'gear'
  | 'planet'
  | 'dizzy'
  | 'laugh'
  | 'cry'
  | 'love'
  | 'angry'
  | 'shocked'
  | 'yawn'
  | 'peek'
  | 'sneeze'
  | 'proud'
  | 'bashful'
  | 'ponder'
  | 'rainbow'
  | 'fireworks'
  | 'sparkle'
  | 'rain'
  | 'snow'
  | 'bubbles'
  | 'confetti'
  | 'halo'
  | 'sonar'
  | 'portal'
  | 'galaxy'
  | 'meteor'
  | 'rocket'
  | 'ufo'
  | 'robot'
  | 'ghost'
  | 'vinyl'
  | 'target'
  /** transition d'interface, pas une animation du catalogue : hors `SEQUENCE` */
  | 'swirl'

export interface StateDef {
  id: StateId
  /** duree de maintien quand la sequence complete est jouee */
  duration: number
  /**
   * duree en dessous de laquelle l'animation est coupee avant d'aboutir : le
   * "!" ne revient pas, le corps reste eclate. Elle se lit dans les constantes
   * de `pose` ci-dessous, elle ne se choisit pas. Absente = l'etat ignore le
   * temps ou boucle, n'importe quelle duree lui va (voir `MIN_BLOCK`).
   */
  minDuration?: number
  /** duree du morph d'entree */
  morph: number
  /** true = l'entree est masquee par un clignement, comme dans la video */
  blinkIn: boolean
  /**
   * true = le corps est la silhouette "au repos", donc remplacable par la forme
   * choisie dans le personnalisateur. Les etats qui dessinent leur propre forme
   * (le "!", les points, l'oeuf, le triangle...) valent false : c'est cette forme
   * la qui EST l'animation.
   */
  baseBody: boolean
  /**
   * true = l'etat porte le visage "au repos", donc remplacable par l'expression
   * choisie. Seul `idle` : les autres etats a visage ont une expression relevee
   * sur la video, c'est precisement ce qu'on reproduit.
   */
  baseFace: boolean
  pose(local: number): Pose
}

/** Onde de pulsation qui parcourt les trois points de gauche a droite. */
function dotPulse(t: number, index: number): number {
  const p = ((((t - index * 0.5) / 1.5) % 1) + 1) % 1
  const k = p < 0.5 ? 0.5 - 0.5 * Math.cos(p * TAU) : 0
  return clamp(k * 2)
}


/* ------------------------------------------- pack d'extension (v0.2) */
/*
 * Cinquante-deux etats de plus, CHOISIS et non releves : ils empruntent le
 * vocabulaire mesure des quatorze d'origine (memes profils, memes anneaux,
 * memes particules) et le recombinent. Aucun n'est `baseBody` ni `baseFace` :
 * leur silhouette et leur visage font partie de l'animation, donc la table
 * d'`eyefit` — qui ne couvre que les etats a corps de base — ne grossit pas.
 */

type WobTerm = readonly [k: number, amp: number, speed: number, phase: number]

/** Silhouette a partir d'un profil radial brut. */
const prof = (radii: number[], pose: Partial<Silhouette> = {}): Silhouette => ({
  radii: [...radii],
  rot: 0,
  cx: 0,
  cy: 0,
  sx: 1,
  sy: 1,
  ...pose
})

/** Corps ondule : somme d'harmoniques angulaires animees dans le temps. */
function wobSil(t: number, terms: WobTerm[], pose: Partial<Silhouette> = {}): Silhouette {
  const radii = Array.from({ length: PROFILE_SAMPLES }, (_, i) => {
    const a = (i / PROFILE_SAMPLES) * TAU
    let r = 1
    for (const [k, amp, speed, phase] of terms) r += amp * Math.sin(k * a + phase + t * speed)
    return r
  })
  return prof(radii, pose)
}

const dot = (x: number, y: number, r: number, opacity = 1, color?: string): DotRender =>
  color ? { x, y, r, opacity, color } : { x, y, r, opacity }

const ringSeed = (over: Partial<ArcSeed>): ArcSeed => ({
  a: 1.32,
  k: 0.3,
  tilt: 0,
  speed: 1,
  phase: 0,
  sweep: 0.7,
  hue: 200,
  hueSpan: 80,
  width: 0.055,
  cx: 0,
  cy: 0,
  ...over
})

const arcsOf = (seeds: ArcSeed[], t: number, opacity: number, prefix: string): ArcSpec[] =>
  seeds.map((seed, i) => ({ id: `${prefix}${i}`, seed, t, opacity }))

/** Etoile douce a cinq branches, meme construction que la forme du personnalisateur. */
const STAR_PROF = (() => {
  const verts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 10) * TAU
    const r = i % 2 === 0 ? 1.1 : 0.84
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
  return profileFromPolygon(verts, 0, 0)
})()

/** Coeur dodu : max radial de l'union des lobes et du triangle de pointe. */
const HEART_PROF = (() => {
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
  const raw = lobes.map((r, i) => Math.max(r, pointe[i]!))
  const peak = Math.max(...raw)
  return raw.map((r) => (r / peak) * 1.06)
})()

export const STATES: StateDef[] = [
  {
    id: 'idle',
    duration: 2.4,
    morph: 0.45,
    blinkIn: false,
    baseFace: true,
    baseBody: true,
    pose: () => base()
  },

  {
    id: 'thinking',
    duration: 2.6,
    morph: 0.4,
    baseFace: false,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      const mid = dotPulse(t, 1)
      // Les points lateraux sortent des flancs de la boule : dans la video ils
      // restent fusionnes avec elle 1-2 frames avant de se detacher.
      const emerge = 0.3 + 0.7 * easings.easeOutCubic(clamp(t / 0.3))
      return base({
        // la boule DEVIENT le point du milieu : le morph reste continu
        sil: circle(DOT_R * (1 + (DOT_PEAK - 1) * mid), { cx: DOT_X[1]! }),
        eyeAlpha: 0,
        dots: [0, 2].map((i) => {
          const k = dotPulse(t, i)
          return {
            x: DOT_X[i]! * emerge,
            y: 0,
            r: DOT_R * (1 + (DOT_PEAK - 1) * k),
            opacity: 0.55 + 0.45 * k
          }
        })
      })
    }
  },

  {
    id: 'wink',
    duration: 1.6,
    morph: 0.3,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: () =>
      base({
        gaze: { yaw: -5.37, pitch: 4.55, roll: 6.7 },
        split: 16.25,
        // L'oeil ferme n'est pas l'oeil ouvert ecrase : c'est un tiret
        // horizontal PLUS LARGE que l'oeil ouvert (0.447 contre 0.236).
        eyes: [
          { w: 0.236, h: 0.464, open: 1 },
          { w: 0.447, h: 0.089, open: 1 }
        ]
      })
  },

  {
    id: 'wide',
    duration: 1.8,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: () =>
      base({
        gaze: { yaw: 6.92, pitch: -21.96, roll: 11.6 },
        split: 18.43,
        eyes: pair(0.356, 0.875)
      })
  },

  {
    id: 'alert',
    duration: 2.4,
    // le "!" revient en place a 1.6 + 0.4
    minDuration: 2,
    morph: 0.45,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: (t) => {
      // Course mesuree : -0.087 -> +0.732 en 1.5 s, ease-in-out, micro-overshoot.
      const p = clamp(t / 1.5)
      const travel = easings.easeInOutCubic(p) * 0.82 - 0.087
      const back = t > 1.6 ? clamp((t - 1.6) / 0.4) : 0
      const x = travel * (1 - back) + 0.1 * back
      // Vibration secondaire a 2.5 Hz, barre et point en opposition de phase.
      const buzz = Math.sin(t * 2.5 * TAU) * 0.005
      const tilt = (17.7 * Math.PI) / 180
      return base({
        sil: barItalic({ rot: tilt, cx: x, cy: -0.325 - buzz }),
        eyeAlpha: 0,
        dots: [
          {
            // le point suit l'axe du glyphe, a 0.580 du centre de la barre
            x: x - Math.sin(tilt) * 0.58,
            y: -0.325 + Math.cos(tilt) * 0.58 + buzz * 2.8,
            r: 0.118,
            d: TEAR,
            rot: (tilt * 180) / Math.PI,
            opacity: 1
          }
        ]
      })
    }
  },

  {
    id: 'notify',
    duration: 2.2,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: (t) => {
      // Pop du point bleu : pic a +14 % vers 0.3 s puis stabilisation.
      const p = clamp(t / 0.45)
      const pop = 1 + (NOTIF_POP - 1) * Math.sin(p * Math.PI) * (1 - p * 0.35)
      const r = NOTIF_R * (p < 1 ? pop : 1)
      const a = (NOTIF_ANGLE * Math.PI) / 180
      return base({
        // le regard part a l'oppose de la pastille
        gaze: { yaw: -21.94, pitch: -5.82, roll: -12.2 },
        split: 18.89,
        eyes: pair(0.505, 0.498),
        notif: {
          x: Math.cos(a) * NOTIF_DIST,
          y: Math.sin(a) * NOTIF_DIST,
          r,
          notch: r + NOTIF_MARGIN
        }
      })
    }
  },

  {
    id: 'exclaim',
    duration: 2,
    morph: 0.45,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: () =>
      base({
        sil: barUpright(),
        eyeAlpha: 0,
        dots: [{ x: -0.012, y: 0.526, r: 0.113, opacity: 1 }]
      })
  },

  {
    id: 'sleep',
    duration: 2.4,
    morph: 0.5,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: (t) =>
      base({
        // Rebond vertical mesure : +-0.19 autour de +0.11, periode 0.6 s.
        sil: circle(0.1585, { cy: 0.11 + Math.sin(t * (TAU / 0.6)) * 0.19 }),
        eyeAlpha: 0
      })
  },

  {
    id: 'egg',
    duration: 1.8,
    morph: 0.4,
    baseFace: false,
    baseBody: false,
    blinkIn: true,
    pose: () =>
      base({
        sil: silhouette('egg'),
        gaze: { yaw: 19.97, pitch: 26.01, roll: -17.1 },
        // les yeux se resserrent comme le corps
        split: 11.07,
        eyes: pair(0.164, 0.385)
      })
  },

  {
    id: 'hexagon',
    duration: 1.6,
    morph: 0.4,
    baseFace: false,
    baseBody: false,
    blinkIn: true,
    pose: () =>
      base({
        sil: silhouette('hexagon'),
        gaze: { yaw: 23.11, pitch: 24.42, roll: -13.3 },
        split: 13.37,
        eyes: pair(0.177, 0.411)
      })
  },

  {
    id: 'play',
    duration: 2,
    morph: 0.5,
    baseFace: false,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      // Le triangle reste quasi immobile pendant que le bouquet le traverse.
      const fade = clamp(t / 0.35) * clamp((2.2 - t) / 0.5)
      return base({
        sil: spinningTriangle(0),
        gaze: { yaw: 12, pitch: -8, roll: -6 },
        split: 15,
        eyes: pair(0.18, 0.34),
        // le bouquet balaie de la droite vers la gauche par-dessus le triangle
        arcs: SWOOSH.map((s, i) => ({
          id: `sw${i}`,
          seed: { ...s, cx: 0.45 - t * 0.42 },
          t,
          opacity: fade
        }))
      })
    }
  },

  {
    id: 'orbit',
    duration: 3.4,
    // le corps a fini de se relacher du triangle vers la boule a 1.6 + 0.9
    minDuration: 2.5,
    morph: 0.6,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: (t) => {
      // Rotation mesuree : rampe sur 0.35 s puis 1.25 tour/s (sens antihoraire).
      const ramp = easings.easeInOutCubic(clamp(t / 0.35))
      const rot = -TAU * 1.25 * t * ramp
      // Le corps se relache du triangle vers la boule pendant l'orbite.
      const back = easings.easeInOutCubic(clamp((t - 1.6) / 0.9))
      const tri = spinningTriangle(rot)
      const ball = circle(1, { rot })
      const sil: Silhouette = {
        radii: tri.radii.map((r, i) => r + (ball.radii[i]! - r) * back),
        rot,
        cx: tri.cx * (1 - back),
        cy: tri.cy * (1 - back),
        sx: 1,
        sy: 1
      }
      const fade = clamp(t / 0.8) * clamp((3.6 - t) / 0.9)
      return base({
        sil,
        // les yeux filent autour de la sphere ~3x plus vite que la silhouette
        gaze: {
          yaw: REST_GAZE.yaw + Math.sin(t * 6.5) * 65 * (1 - back),
          pitch: -4 + back * 32,
          roll: -13
        },
        eyes: pair(0.18, 0.34 + back * 0.07),
        // les anneaux entrent un par un sur 0.8 s
        arcs: RINGS.map((s, i) => ({
          id: `rg${i}`,
          seed: s,
          t,
          opacity: fade * clamp((t - i * 0.13) / 0.3)
        }))
      })
    }
  },

  {
    /**
     * Entree dans la vue des reglages.
     *
     * SEUL etat qui n'est pas releve sur la video : il est CHOISI, comme la
     * couleur `--ink`. Il emprunte le vocabulaire d'`orbit` — les memes anneaux,
     * avec leurs parametres mesures — mais coupe court : 1 s au lieu de 3,4, la
     * moitie des anneaux, et aucun triangle.
     *
     * Les deux drapeaux a `true` sont tout l'interet de cet etat :
     *
     * - `baseBody` laisse la forme choisie remplacer le corps, donc la vue peut
     *   imposer le cercle et le galet ou la goutte y MORPHENT au lieu de sauter ;
     * - `baseFace` fait porter le visage de repos, donc le suivi du curseur
     *   s'applique des cette entree. Un etat qui aurait sa propre pose de regard
     *   (comme `orbit`) rendrait la main a l'etat suivant en pleine course, et
     *   les yeux sauteraient d'un coup a la reprise.
     *
     * Il n'est volontairement PAS dans `SEQUENCE` : ce n'est pas une animation du
     * catalogue, c'est une transition d'interface.
     */
    id: 'swirl',
    // un peu plus que le tour du regard (`TURN_TIME`, 1,1 s) : les yeux doivent
    // etre poses a gauche avant que les anneaux ne s'effacent
    duration: 1.3,
    minDuration: 1.3,
    morph: 0.3,
    baseFace: true,
    baseBody: true,
    // le morph de forme est masque par un clignement, comme partout ailleurs
    blinkIn: true,
    pose: (t) =>
      base({
        // trois anneaux sur les six d'`orbit` : la moitie du bouquet suffit a le
        // reconnaitre, et c'est autant d'arcs en moins a rasteriser par image
        arcs: RINGS.slice(0, 3).map((s, i) => ({
          id: `sw${i}`,
          seed: s,
          t,
          // ils entrent l'un apres l'autre puis s'effacent avant la fin du bloc,
          // pour que la reprise au repos se fasse sur une image deja propre
          opacity: clamp((t - i * 0.06) / 0.14) * clamp((1.22 - t) / 0.34)
        }))
      })
  },

  {
    id: 'burst',
    duration: 2.6,
    // le corps est recompose a 1.7 + 0.7
    minDuration: 2.4,
    morph: 0.4,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: (t) => {
      // Effondrement mesure : 1.0 -> 0.166 en 0.7 s, ease-out, sans rebond.
      const collapse = 1 - 0.834 * easings.easeOutQuint(clamp(t / 0.7))
      const regrow = easings.easeOutQuint(clamp((t - 1.7) / 0.7))
      return base({
        sil: circle(collapse + (1 - collapse) * regrow),
        eyeAlpha: clamp((t - 1.85) / 0.4),
        dots: particles(t, 1),
        dotsBehind: true
      })
    }
  },

  {
    id: 'comet',
    duration: 2.4,
    // le point se recompose a 1.85 + 0.6 = 2.45, soit 0.05 s apres la coupe de
    // la video : ce reliquat se termine pendant le fondu suivant, comme dans la
    // reference. On ne descend donc pas sous la duree mesuree.
    minDuration: 2.4,
    morph: 0.45,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: (t) => {
      const collapse = 1 - (1 - COMET_DOT) * easings.easeOutQuint(clamp(t / 0.55))
      const regrow = easings.easeOutQuint(clamp((t - 1.85) / 0.6))
      const fade = clamp((t - 0.15) / 0.25) * clamp((1.95 - t) / 0.3)
      return base({
        // Le point derive de 0.035 vers le bas puis remonte (wobble mesure).
        sil: circle(collapse + (1 - collapse) * regrow, {
          cy: Math.sin(clamp(t / 1.7) * Math.PI) * 0.035
        }),
        eyeAlpha: clamp((t - 2) / 0.35),
        arcs: COMET_RIBBONS.map((s, i) => ({ id: `cm${i}`, seed: s, t, opacity: fade }))
      })
    }
  }
,
{
    id: 'bounce',
    duration: 2,
    morph: 0.4,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const u = Math.sin(t * (TAU / 0.9))
      return base({
        sil: circle(1, { sx: 1 + 0.06 * u, sy: 1 - 0.06 * u }),
        offY: -0.15 * Math.max(0, u),
        gaze: { yaw: 10, pitch: 12, roll: 0 },
        eyes: pair(0.24, 0.4)
      })
    }
  },

  {
    id: 'dance',
    duration: 2.4,
    morph: 0.4,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const u = Math.sin(t * (TAU / 1.2))
      return base({
        sil: circle(1, { rot: 0.14 * u, sx: 1 + 0.03 * u, sy: 1 - 0.03 * u }),
        offX: 0.12 * u,
        offY: -0.04 * Math.abs(u),
        gaze: { yaw: 14 * u, pitch: 8, roll: 10 * u },
        split: 17,
        eyes: pair(0.3, 0.15)
      })
    }
  },

  {
    id: 'spin',
    duration: 2.8,
    morph: 0.45,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const a = t * 2.4
      return base({
        sil: wobSil(t, [[2, 0.05, 2.4, 0]], { rot: a * 0.4 }),
        gaze: { yaw: 30 * Math.cos(a * 0.55), pitch: 10, roll: 0 },
        eyes: pair(0.2, 0.42),
        dots: [0, Math.PI].map((o) =>
          dot(Math.cos(a + o) * 0.98, Math.sin(a + o) * 0.36, 0.07, 0.9)
        )
      })
    }
  },

  {
    id: 'flip',
    duration: 2.4,
    minDuration: 1.9,
    morph: 0.4,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const p = easings.easeInOutCubic(clamp((t - 0.5) / 1.2))
      return base({
        sil: circle(1, { rot: p * TAU, sx: 1 - 0.22 * Math.sin(p * Math.PI) }),
        gaze: { yaw: 12, pitch: 10 + 20 * Math.sin(p * Math.PI), roll: 0 },
        eyes: pair(0.22, 0.4)
      })
    }
  },

  {
    id: 'wiggle',
    duration: 2.2,
    morph: 0.35,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const w = Math.sin(t * TAU * 2.2)
      return base({
        sil: circle(1, {
          rot: 0.1 * w,
          sx: 1 + 0.09 * Math.sin(t * TAU * 2.2 + 1),
          sy: 1 + 0.09 * Math.sin(t * TAU * 2.2 - 1)
        }),
        gaze: { yaw: 12 * w, pitch: 6, roll: 8 * w },
        eyes: pair(0.22, 0.38)
      })
    }
  },

  {
    id: 'swing',
    duration: 2.6,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const u = Math.sin(t * (TAU / 1.8))
      return base({
        sil: circle(1, { rot: 0.22 * u }),
        offX: 0.2 * u,
        offY: -0.05 * (1 - u * u),
        gaze: { yaw: 20 * u, pitch: 4, roll: 14 * u },
        eyes: pair(0.26, 0.2)
      })
    }
  },

  {
    id: 'hop',
    duration: 2.1,
    morph: 0.4,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const ph = (t % 0.7) / 0.7
      const air = Math.sin(ph * Math.PI)
      const land = ph < 0.16 ? 1 - ph / 0.16 : 0
      return base({
        sil: circle(1, { sx: 1 + 0.13 * land, sy: 1 - 0.13 * land + 0.04 * air }),
        offY: -0.3 * air,
        gaze: { yaw: 8, pitch: 14, roll: 0 },
        eyes: pair(0.3, 0.55)
      })
    }
  },

  {
    id: 'float',
    duration: 3.2,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: circle(1, {
          sx: 1 + 0.02 * Math.sin((t * TAU) / 3.2),
          sy: 1 + 0.03 * Math.sin((t * TAU) / 3.2)
        }),
        offY: -0.1 + 0.07 * Math.sin((t * TAU) / 2.6),
        gaze: { yaw: 8, pitch: -4, roll: 3 * Math.sin((t * TAU) / 2.6) },
        eyes: pair(0.3, 0.1)
      })
  },

  {
    id: 'drift',
    duration: 3,
    morph: 0.5,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        offX: 0.16 * Math.sin((t * TAU) / 2.9),
        offY: 0.12 * Math.sin((t * TAU) / 2.3 + 1.3),
        gaze: {
          yaw: 18 * Math.sin((t * TAU) / 2.9),
          pitch: 10 * Math.sin((t * TAU) / 2.3),
          roll: 0
        },
        eyes: pair(0.2, 0.4)
      })
  },

  {
    id: 'roll',
    duration: 3,
    morph: 0.45,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const u = Math.sin((t * TAU) / 3)
      return base({
        sil: wobSil(t, [[2, 0.06, 0, 0.7]], { rot: 0.6 * u }),
        offX: 0.28 * u,
        gaze: { yaw: 16 * u, pitch: 6, roll: 20 * u },
        eyes: pair(0.22, 0.4)
      })
    }
  },

  {
    id: 'star',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const s = 1 + 0.05 * Math.sin((t * TAU) / 1.1)
      return base({
        sil: prof(STAR_PROF, { rot: 0.15 * Math.sin(t * 1.8), sx: s, sy: s }),
        gaze: { yaw: 12, pitch: 8, roll: 0 },
        split: 14,
        eyes: pair(0.22, 0.4),
        dots: [0, 1, 2].map((i) => {
          const a = i * 2.2 + 0.6
          const tw = Math.pow(Math.max(0, Math.sin(t * 3 + i * 2.1)), 3)
          return dot(Math.cos(a) * 1.28, Math.sin(a) * 1.28, 0.05, tw)
        })
      })
    }
  },

  {
    id: 'heart',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const ph = (t % 1.1) / 1.1
      const thump =
        Math.exp(-(((ph - 0.12) ** 2) / 0.002)) + 0.6 * Math.exp(-(((ph - 0.3) ** 2) / 0.002))
      const s = 1 + 0.07 * thump
      return base({
        sil: prof(HEART_PROF, { sx: s, sy: s }),
        gaze: { yaw: 8, pitch: -4, roll: 0 },
        split: 13.5,
        eyes: pair(0.26, 0.28),
        dots: [dot(-0.62, -0.1, 0.07, 0.5, '#e152b0'), dot(0.62, -0.1, 0.07, 0.5, '#e152b0')]
      })
    }
  },

  {
    id: 'diamond',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: prof(regularPolygonProfile(4, 1.12, 0.16, -90), { rot: 0.3 * Math.sin(t * 1.4) }),
        gaze: { yaw: 10, pitch: 10, roll: 0 },
        split: 13.5,
        eyes: pair(0.2, 0.4),
        dots: [dot(0.3, -1.05, 0.05, Math.pow(Math.max(0, Math.sin(t * 2.6)), 4))]
      })
  },

  {
    id: 'square',
    duration: 2.4,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: prof(superellipseProfile(7), { rot: 0.25 * t }),
        gaze: { yaw: 8, pitch: 6, roll: 0 },
        split: 15,
        eyes: pair(0.26, 0.3)
      })
  },

  {
    id: 'pentagon',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: prof(regularPolygonProfile(5, 1.1, 0.22, -90), { rot: 0.2 * Math.sin(t * 1.2) }),
        gaze: { yaw: 12, pitch: 8, roll: 0 },
        split: 14.5,
        eyes: pair(0.21, 0.42)
      })
  },

  {
    id: 'octagon',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: prof(regularPolygonProfile(8, 1.07, 0.18, 0), { rot: -0.15 * Math.sin(t * 1.1) }),
        gaze: { yaw: 10, pitch: 8, roll: 0 },
        split: 15,
        eyes: pair(0.24, 0.36)
      })
  },

  {
    id: 'flower',
    duration: 2.6,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: wobSil(t, [
          [6, 0.12, 0.9, 0.4],
          [12, 0.02, 1.8, 0]
        ]),
        gaze: { yaw: 10, pitch: 10, roll: 0 },
        eyes: pair(0.2, 0.38)
      })
  },

  {
    id: 'sun',
    duration: 2.6,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const s = 1 + 0.03 * Math.sin((t * TAU) / 1.3)
      return base({
        sil: wobSil(t, [[12, 0.09, 1.5, 0]], { sx: s, sy: s }),
        gaze: { yaw: 8, pitch: 10, roll: 0 },
        eyes: pair(0.3, 0.14)
      })
    }
  },

  {
    id: 'blob',
    duration: 2.8,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: wobSil(t, [
          [3, 0.09, 1.1, 1.2],
          [5, 0.05, 1.7, 3.4],
          [2, 0.04, 0.7, 0.5]
        ]),
        gaze: { yaw: 12, pitch: 6, roll: 0 },
        eyes: pair(0.22, 0.4)
      })
  },

  {
    id: 'wave',
    duration: 2.6,
    morph: 0.5,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: wobSil(t, [
          [3, 0.1, 3.5, 0],
          [6, 0.04, 3.5, 0]
        ]),
        gaze: { yaw: 14, pitch: 4, roll: 6 * Math.sin(t * 1.7) },
        eyes: pair(0.22, 0.38)
      })
  },

  {
    id: 'gear',
    duration: 2.8,
    morph: 0.5,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const radii = Array.from({ length: PROFILE_SAMPLES }, (_, i) => {
        const a = (i / PROFILE_SAMPLES) * TAU
        return 1 + 0.07 * Math.tanh(2.5 * Math.sin(9 * a + t * 1.8))
      })
      return base({
        sil: prof(radii),
        gaze: { yaw: 10, pitch: 6, roll: 0 },
        split: 15,
        eyes: pair(0.24, 0.36)
      })
    }
  },

  {
    id: 'planet',
    duration: 3.2,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const a = t * 0.9
      return base({
        sil: circle(0.92),
        gaze: { yaw: 12, pitch: 8, roll: 0 },
        eyes: pair(0.2, 0.4),
        dots: [dot(Math.cos(a) * 1.18, Math.sin(a) * 0.42 - 0.05, 0.07, 0.95)],
        arcs: arcsOf(
          [ringSeed({ a: 1.35, k: 0.22, tilt: -0.32, speed: 0.5, sweep: 1, hue: 210, hueSpan: 40, width: 0.06, cy: -0.05 })],
          t,
          0.9,
          'pl'
        )
      })
    }
  },

  {
    id: 'dizzy',
    duration: 2.6,
    morph: 0.4,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: circle(1, { rot: 0.12 * Math.sin(t * 3.4) }),
        gaze: { yaw: 28 * Math.cos(t * 3.4), pitch: 26 * Math.sin(t * 3.4), roll: 0 },
        eyes: pair(0.24, 0.34)
      })
  },

  {
    id: 'laugh',
    duration: 2.2,
    morph: 0.35,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: circle(1, { sx: 1 + 0.03 * Math.sin(t * TAU * 2.4) }),
        offX: 0.02 * Math.sin(t * 40),
        offY: -0.05 * Math.abs(Math.sin(t * TAU * 2.4)),
        gaze: { yaw: 6, pitch: 14, roll: 0 },
        split: 17.5,
        eyes: pair(0.34, 0.12)
      })
  },

  {
    id: 'cry',
    duration: 2.6,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const tears = [-0.24, 0.24].map((x, i) => {
        const p = (t * 0.55 + i * 0.4) % 0.85
        return dot(x, 0.18 + p, 0.055, clamp(1 - p / 0.85) * 0.95, '#3b93f0')
      })
      return base({
        sil: circle(1, { sx: 1 + 0.015 * Math.sin(t * 9) }),
        gaze: { yaw: 3, pitch: -10, roll: 0 },
        eyes: [
          { w: 0.28, h: 0.1, open: 1, tilt: -20 },
          { w: 0.28, h: 0.1, open: 1, tilt: 20 }
        ],
        dots: tears
      })
    }
  },

  {
    id: 'love',
    duration: 2.4,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const s = 1 + 0.04 * Math.pow(Math.max(0, Math.sin((t * TAU) / 1.2)), 3)
      const rises = [0, 1, 2, 3].map((i) => {
        const p = (t * 0.45 + i * 0.27) % 1
        return dot(
          -0.75 + i * 0.5 + 0.12 * Math.sin(t * 2 + i),
          0.35 - p * 1.05,
          0.05 + 0.035 * p,
          Math.sin(p * Math.PI) * 0.9,
          '#e152b0'
        )
      })
      return base({
        sil: circle(1, { sx: s, sy: s }),
        gaze: { yaw: 8, pitch: -4, roll: 0 },
        eyes: pair(0.3, 0.3),
        dots: rises
      })
    }
  },

  {
    id: 'angry',
    duration: 2.2,
    morph: 0.4,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: circle(1.03 + 0.02 * Math.sin(t * 9)),
        offX: 0.02 * Math.sin(t * 47),
        gaze: { yaw: 3, pitch: 9, roll: 0 },
        split: 16.5,
        eyes: [
          { w: 0.34, h: 0.15, open: 1, tilt: 30 },
          { w: 0.34, h: 0.15, open: 1, tilt: -30 }
        ]
      })
  },

  {
    id: 'shocked',
    duration: 2,
    morph: 0.4,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: circle(0.84),
        offY: 0.015 * Math.sin(t * 30),
        gaze: { yaw: 2, pitch: -18, roll: 0 },
        split: 20,
        eyes: pair(0.48, 0.85)
      })
  },

  {
    id: 'yawn',
    duration: 2.8,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const ph = (t % 2.8) / 2.8
      const open = 1 - 0.8 * Math.sin(ph * Math.PI)
      return base({
        sil: circle(1, { rot: 0.06 * Math.sin(t * 1.4) }),
        gaze: { yaw: 6, pitch: -6, roll: 0 },
        eyes: [
          { w: 0.24, h: 0.42, open },
          { w: 0.24, h: 0.42, open }
        ]
      })
    }
  },

  {
    id: 'peek',
    duration: 3,
    morph: 0.45,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const u = Math.sin((t * TAU) / 3)
      return base({
        offX: 0.1 * u,
        gaze: { yaw: 34 * u, pitch: 4, roll: 8 * u },
        eyes: [
          { w: 0.2, h: 0.42, open: 1 },
          { w: 0.2, h: 0.3, open: 1 }
        ]
      })
    }
  },

  {
    id: 'sneeze',
    duration: 2.4,
    minDuration: 1.6,
    morph: 0.4,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      if (t < 0.9) {
        const p = clamp(t / 0.9)
        return base({
          sil: circle(1 - 0.12 * p),
          gaze: { yaw: 4, pitch: 8, roll: 0 },
          eyes: [
            { w: 0.26, h: 0.36, open: 1 - p },
            { w: 0.26, h: 0.36, open: 1 - p }
          ]
        })
      }
      if (t < 1.35) {
        const p = (t - 0.9) / 0.45
        const spray = [0, 1, 2, 3, 4, 5].map((i) => {
          const a = -0.5 + i * 0.2
          const d = 0.35 + p * 1.05
          return dot(Math.sin(a) * d + 0.15 * p, Math.cos(a) * d * 0.7 + 0.25 * p, 0.045, (1 - p) * 0.9)
        })
        return base({
          sil: circle(1 + 0.05 * (1 - p)),
          offY: 0.1 * (1 - p),
          gaze: { yaw: 4, pitch: -4, roll: 0 },
          eyes: pair(0.3, 0.14),
          dots: spray
        })
      }
      const back = easings.easeOutCubic(clamp((t - 1.35) / 0.6))
      return base({
        sil: circle(1),
        gaze: { yaw: 4, pitch: lerp(-4, 6, back), roll: 0 },
        eyes: pair(0.26, lerp(0.14, 0.38, back))
      })
    }
  },

  {
    id: 'proud',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: () =>
      base({
        sil: circle(1, { sx: 0.94, sy: 1.12 }),
        offY: -0.03,
        gaze: { yaw: 6, pitch: 18, roll: 0 },
        split: 17,
        eyes: [
          { w: 0.3, h: 0.16, open: 1, tilt: 16 },
          { w: 0.3, h: 0.16, open: 1, tilt: -16 }
        ]
      })
  },

  {
    id: 'bashful',
    duration: 2.4,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: () =>
      base({
        sil: circle(0.92),
        gaze: { yaw: -18, pitch: -14, roll: -6 },
        split: 14,
        eyes: pair(0.18, 0.32),
        dots: [dot(-0.52, 0.18, 0.1, 0.5, '#e152b0'), dot(0.52, 0.18, 0.1, 0.5, '#e152b0')]
      })
  },

  {
    id: 'ponder',
    duration: 2.6,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const pulse = 0.75 + 0.25 * Math.sin(t * 2.2)
      return base({
        gaze: { yaw: -20, pitch: -18, roll: -5 },
        eyes: [
          { w: 0.22, h: 0.4, open: 1 },
          { w: 0.22, h: 0.26, open: 1 }
        ],
        dots: [0, 1, 2].map((i) =>
          dot(0.58 + i * 0.17, -0.32 - i * 0.24, 0.04 + i * 0.025, pulse)
        )
      })
    }
  },

  {
    id: 'rainbow',
    duration: 3.2,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const fade = clamp(t / 0.7) * clamp((3.4 - t) / 0.8)
      return base({
        gaze: { yaw: 8, pitch: 10, roll: 0 },
        split: 17.5,
        eyes: pair(0.28, 0.16),
        arcs: RINGS.map((sd, i) => ({
          id: `rb${i}`,
          seed: { ...sd, hue: sd.hue + t * 60 },
          t,
          opacity: fade
        }))
      })
    }
  },

  {
    id: 'fireworks',
    duration: 2.8,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const colors = ['#e8483f', '#f0b429', '#3ecf8e', '#3b93f0', '#e152b0', '#f08a24']
      const centers: Array<[number, number, number]> = [
        [-0.85, -0.75, 0],
        [0.9, -0.5, 0.33],
        [0.1, -1.05, 0.66]
      ]
      const dots: DotRender[] = []
      centers.forEach(([cx, cy, off], ci) => {
        const p = (t * 0.55 + off) % 1
        const d = 0.12 + 0.55 * easings.easeOutCubic(p)
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU + off * 3
          dots.push(dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.045, (1 - p) * 0.95, colors[(k + ci * 2) % colors.length]!))
        }
      })
      return base({
        sil: circle(0.82),
        offY: 0.35,
        gaze: { yaw: 4, pitch: -16, roll: 0 },
        split: 19,
        eyes: pair(0.36, 0.6),
        dots
      })
    }
  },

  {
    id: 'sparkle',
    duration: 2.6,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const seeds: Array<[number, number, number]> = [
        [0.4, 1.2, 0], [1.5, 1.05, 2], [2.6, 1.25, 4], [3.7, 1.1, 1], [4.8, 1.22, 3], [5.7, 1.08, 5],
        [0.9, 1.35, 2.5], [2.1, 1.38, 0.5], [3.2, 1.33, 3.5], [4.3, 1.36, 1.5], [5.3, 1.3, 4.5], [1.9, 0.95, 5.5]
      ]
      return base({
        gaze: { yaw: 10, pitch: 8, roll: 0 },
        eyes: pair(0.24, 0.42),
        dots: seeds.map(([a, r, ph]) =>
          dot(Math.cos(a) * r, Math.sin(a) * r, 0.05, Math.pow(Math.max(0, Math.sin(t * 3 + ph)), 3))
        )
      })
    }
  },

  {
    id: 'rain',
    duration: 2.6,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const drops = Array.from({ length: 12 }, (_, i) => {
        const seed = (i * 0.37) % 1
        const y = ((seed + t * 0.85) % 1.7) - 0.85
        return dot(-0.95 + i * 0.17, y, 0.035, 0.55, '#3b93f0')
      })
      return base({
        gaze: { yaw: 4, pitch: -8, roll: 0 },
        eyes: [
          { w: 0.2, h: 0.3, open: 0.6 },
          { w: 0.2, h: 0.3, open: 0.6 }
        ],
        dots: drops
      })
    }
  },

  {
    id: 'snow',
    duration: 3.2,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const flakes = Array.from({ length: 12 }, (_, i) => {
        const seed = (i * 0.53) % 1
        const y = ((seed + t * 0.16) % 1.8) - 0.9
        const x = -1 + (i % 6) * 0.4 + 0.08 * Math.sin(t * 1.3 + i * 1.7)
        return dot(x, y, 0.04 + (i % 3) * 0.012, 0.85, '#8fb6d9')
      })
      return base({
        gaze: { yaw: 6, pitch: -6, roll: 0 },
        split: 17.5,
        eyes: pair(0.26, 0.34)
      , dots: flakes })
    }
  },

  {
    id: 'bubbles',
    duration: 3,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const bubbles = Array.from({ length: 9 }, (_, i) => {
        const p = (t * 0.3 + i * 0.13) % 1
        return dot(
          -0.9 + ((i * 0.29) % 1.8) + 0.07 * Math.sin(t * 2 + i * 2),
          0.95 - p * 1.9,
          0.04 + 0.05 * p,
          0.25 + 0.55 * Math.sin(p * Math.PI),
          '#7fd4f2'
        )
      })
      return base({
        gaze: { yaw: 6, pitch: -12, roll: 0 },
        split: 19,
        eyes: pair(0.36, 0.5),
        dots: bubbles
      })
    }
  },

  {
    id: 'confetti',
    duration: 2.8,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const colors = ['#e8483f', '#f0b429', '#3ecf8e', '#3b93f0', '#e152b0']
      const pieces = Array.from({ length: 14 }, (_, i) => {
        const seed = (i * 0.41) % 1
        const y = ((seed + t * 0.42) % 1.9) - 0.95
        const x = -1 + ((i * 0.23) % 2) + 0.13 * Math.sin(t * 2.2 + i * 1.3)
        return dot(x, y, 0.045, 0.95, colors[i % colors.length]!)
      })
      return base({
        offY: -0.04 * Math.abs(Math.sin(t * TAU * 1.4)),
        gaze: { yaw: 6, pitch: 12, roll: 0 },
        split: 17.5,
        eyes: pair(0.34, 0.12),
        dots: pieces
      })
    }
  },

  {
    id: 'halo',
    duration: 3,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        offY: 0.05 * Math.sin((t * TAU) / 3),
        gaze: { yaw: 5, pitch: 5, roll: 0 },
        eyes: pair(0.3, 0.1),
        arcs: arcsOf(
          [ringSeed({ a: 1.28, k: 0.18, tilt: -0.08, speed: 0.8, sweep: 1, hue: 45, hueSpan: 20, width: 0.07, cy: -0.12 })],
          t,
          0.9,
          'ha'
        )
      })
  },

  {
    id: 'sonar',
    duration: 2.8,
    morph: 0.45,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const dots: DotRender[] = []
      for (const off of [0, 0.7]) {
        const p = ((t + off) % 1.4) / 1.4
        const r = 0.35 + 0.95 * p
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU
          dots.push(dot(Math.cos(a) * r, Math.sin(a) * r, 0.04, (1 - p) * 0.8))
        }
      }
      return base({
        sil: circle(0.85),
        gaze: { yaw: 4, pitch: 5, roll: -4 },
        split: 16,
        eyes: pair(0.21, 0.44),
        dots
      })
    }
  },

  {
    id: 'portal',
    duration: 3.2,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const fade = clamp(t / 0.7) * clamp((3.4 - t) / 0.8)
      const s = 1 - 0.13 * Math.pow(Math.sin((t * Math.PI) / 2.4), 2)
      return base({
        sil: circle(s),
        gaze: { yaw: 3, pitch: -3, roll: 0 },
        split: 19.5,
        eyes: pair(0.4, 0.56),
        arcs: RINGS.map((sd, i) => ({
          id: `po${i}`,
          seed: { ...sd, a: sd.a * (0.85 + 0.2 * Math.sin(t * 2 + i)) },
          t,
          opacity: fade
        }))
      })
    }
  },

  {
    id: 'galaxy',
    duration: 3.4,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const seeds = [0, 1, 2, 3, 4].map((i) =>
        ringSeed({
          a: 1.25 + i * 0.06,
          k: 0.15 + i * 0.07,
          tilt: i * 0.65,
          speed: 0.7 + i * 0.22,
          phase: i * 1.3,
          sweep: 0.8,
          hue: i * 72,
          hueSpan: 70,
          width: 0.05
        })
      )
      return base({
        sil: circle(0.9),
        gaze: { yaw: 10, pitch: 6, roll: 0 },
        eyes: pair(0.22, 0.4),
        arcs: arcsOf(seeds, t, 0.9, 'gx'),
        dots: [0, 1, 2, 3, 4].map((i) => {
          const a = i * 1.9 + 0.4
          return dot(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.04, Math.pow(Math.max(0, Math.sin(t * 2.4 + i * 1.8)), 3))
        })
      })
    }
  },

  {
    id: 'meteor',
    duration: 2.4,
    minDuration: 2.4,
    morph: 0.45,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const collapse = 1 - (1 - COMET_DOT) * easings.easeOutQuint(clamp(t / 0.55))
      const regrow = easings.easeOutQuint(clamp((t - 1.85) / 0.6))
      const fade = clamp((t - 0.15) / 0.25) * clamp((1.95 - t) / 0.3)
      return base({
        sil: circle(collapse + (1 - collapse) * regrow, {
          cy: Math.sin(clamp(t / 1.7) * Math.PI) * 0.035
        }),
        eyeAlpha: clamp((t - 2) / 0.35),
        arcs: COMET_RIBBONS.map((sd, i) => ({
          id: `mt${i}`,
          seed: { ...sd, tilt: -sd.tilt, speed: -sd.speed },
          t,
          opacity: fade
        }))
      })
    }
  },

  {
    id: 'rocket',
    duration: 2.6,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const exhaust = [0, 1, 2, 3].map((i) => {
        const p = (t * 1.6 + i * 0.25) % 1
        return dot(
          0.06 * Math.sin(t * 9 + i * 2),
          0.72 + p * 0.55,
          0.07 * (1 - p * 0.6),
          (1 - p) * 0.95,
          i % 2 === 0 ? '#f08a24' : '#f0b429'
        )
      })
      return base({
        sil: silhouette('triangle', { rot: 0.12 * Math.sin(t * 7), cy: -0.08 }),
        offX: 0.015 * Math.sin(t * 40),
        offY: -0.06 + 0.03 * Math.sin(t * 2.2),
        gaze: { yaw: 12, pitch: -6, roll: -6 },
        split: 13,
        eyes: pair(0.18, 0.34),
        dots: exhaust,
        dotsBehind: true
      })
    }
  },

  {
    id: 'ufo',
    duration: 3,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const colors = ['#f0b429', '#3ecf8e', '#3b93f0', '#e152b0', '#e8483f']
      const lights = [0, 1, 2, 3, 4].map((i) =>
        dot(-0.8 + i * 0.4, 0.3, 0.06, 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 3 + i * 1.26)), 2), colors[i]!)
      )
      return base({
        sil: circle(1, { sx: 1.35, sy: 0.6 }),
        offY: -0.05 + 0.05 * Math.sin((t * TAU) / 3),
        gaze: { yaw: 10, pitch: -10, roll: 0 },
        eyes: pair(0.2, 0.36),
        dots: lights
      })
    }
  },

  {
    id: 'robot',
    duration: 2.6,
    morph: 0.45,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) =>
      base({
        sil: prof(superellipseProfile(9)),
        gaze: { yaw: Math.round(Math.sin(t * 1.8)) * 16, pitch: 0, roll: 0 },
        split: 16,
        eyes: pair(0.34, 0.22),
        dots: [dot(0, -1.14, 0.055, 0.4 + 0.6 * Math.pow(Math.max(0, Math.sin(t * 3)), 2), '#e8483f')]
      })
  },

  {
    id: 'ghost',
    duration: 3,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const radii = Array.from({ length: PROFILE_SAMPLES }, (_, i) => {
        const a = (i / PROFILE_SAMPLES) * TAU
        const bottom = Math.max(0, Math.sin(a))
        return 1 + bottom * 0.06 * Math.sin(5 * a - t * 6) * bottom
      })
      return base({
        sil: prof(radii),
        offY: -0.06 + 0.06 * Math.sin((t * TAU) / 3),
        gaze: { yaw: 10, pitch: 6, roll: 0 },
        split: 14,
        eyes: pair(0.16, 0.3)
      })
    }
  },

  {
    id: 'vinyl',
    duration: 3,
    morph: 0.5,
    blinkIn: false,
    baseFace: false,
    baseBody: false,
    pose: (t) => {
      const a = t * 1.8 + 0.8
      return base({
        sil: circle(1, { rot: t * 1.8 }),
        gaze: { yaw: 12, pitch: 8, roll: 0 },
        eyes: pair(0.2, 0.4),
        dots: [dot(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.09, 0.9, '#e8483f')],
        arcs: arcsOf(
          [
            ringSeed({ a: 0.78, k: 1, tilt: 0, speed: 0, sweep: 1, hue: 260, hueSpan: 30, width: 0.02 }),
            ringSeed({ a: 0.9, k: 1, tilt: 0, speed: 0, sweep: 1, hue: 300, hueSpan: 30, width: 0.02 })
          ],
          t,
          0.55,
          'vn'
        )
      })
    }
  },

  {
    id: 'target',
    duration: 2.2,
    morph: 0.45,
    blinkIn: true,
    baseFace: false,
    baseBody: false,
    pose: () =>
      base({
        sil: circle(0.85),
        gaze: { yaw: 28.49, pitch: 28.62, roll: -13 },
        split: 13,
        eyes: pair(0.17, 0.3),
        dots: [
          dot(0, 0.42, 0.09, 0.9, '#e8483f'),
          ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const a = (k / 8) * TAU
            return dot(Math.cos(a) * 0.52, Math.sin(a) * 0.52 + 0.42, 0.04, 0.7, '#e8483f')
          })
        ]
      })
  }
]

export const STATE_BY_ID = new Map(STATES.map((s) => [s.id, s]))

/** Ordre de lecture de la sequence complete, calque sur la video de reference. */
/**
 * Date, en temps local, ou chaque etat est le plus lisible : c'est la pose que
 * montrent les vignettes et la planche. Rendu deterministe, donc comparable
 * d'une execution a l'autre. Le type force a couvrir tout nouvel etat.
 */
export const POSES: Record<StateId, number> = {
  idle: 1,
  thinking: 1.1,
  wink: 0.8,
  wide: 0.8,
  alert: 0.75,
  notify: 0.9,
  exclaim: 0.8,
  sleep: 0.45,
  egg: 0.8,
  hexagon: 0.8,
  play: 0.9,
  orbit: 1.2,
  swirl: 0.5,
  burst: 0.45,
  comet: 1.15,
  bounce: 0.5,
  dance: 0.6,
  spin: 1.2,
  flip: 1.1,
  wiggle: 0.6,
  swing: 0.5,
  hop: 0.35,
  float: 1.2,
  drift: 1.1,
  roll: 0.8,
  star: 1.0,
  heart: 0.9,
  diamond: 1.0,
  square: 1.0,
  pentagon: 1.0,
  octagon: 1.0,
  flower: 1.1,
  sun: 1.1,
  blob: 1.2,
  wave: 1.1,
  gear: 1.2,
  planet: 1.2,
  dizzy: 1.0,
  laugh: 0.9,
  cry: 1.0,
  love: 0.9,
  angry: 0.9,
  shocked: 0.9,
  yawn: 1.4,
  peek: 0.8,
  sneeze: 1.05,
  proud: 0.9,
  bashful: 0.9,
  ponder: 1.1,
  rainbow: 1.2,
  fireworks: 0.8,
  sparkle: 1.1,
  rain: 1.1,
  snow: 1.2,
  bubbles: 1.2,
  confetti: 1.1,
  halo: 1.2,
  sonar: 0.7,
  portal: 1.2,
  galaxy: 1.2,
  meteor: 1.1,
  rocket: 1.1,
  ufo: 1.2,
  robot: 1.0,
  ghost: 1.2,
  vinyl: 1.2,
  target: 0.9
}

export const SEQUENCE: StateId[] = [
  'idle',
  'thinking',
  'wink',
  'wide',
  'alert',
  'notify',
  'exclaim',
  'sleep',
  'egg',
  'hexagon',
  'play',
  'orbit',
  'burst',
  'comet',
  'bounce',
  'dance',
  'spin',
  'flip',
  'wiggle',
  'swing',
  'hop',
  'float',
  'drift',
  'roll',
  'star',
  'heart',
  'diamond',
  'square',
  'pentagon',
  'octagon',
  'flower',
  'sun',
  'blob',
  'wave',
  'gear',
  'planet',
  'dizzy',
  'laugh',
  'cry',
  'love',
  'angry',
  'shocked',
  'yawn',
  'peek',
  'sneeze',
  'proud',
  'bashful',
  'ponder',
  'rainbow',
  'fireworks',
  'sparkle',
  'rain',
  'snow',
  'bubbles',
  'confetti',
  'halo',
  'sonar',
  'portal',
  'galaxy',
  'meteor',
  'rocket',
  'ufo',
  'robot',
  'ghost',
  'vinyl',
  'target'
]
