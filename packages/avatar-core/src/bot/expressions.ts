import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE, type HeadGaze } from './face.js'
import { lerp } from './math.js'
import type { EyeCfg } from './states.js'

/**
 * Expression de repos du bot.
 *
 * Le visage ne tient qu'à deux gélules, donc tout se joue sur quatre leviers :
 * l'orientation de la tête, l'écart des yeux, leurs proportions, et
 * l'inclinaison propre de chaque œil. C'est ce dernier qui permet la colère et
 * la tristesse : elles demandent des inclinaisons EN MIROIR (les hauts qui
 * convergent ou divergent), impossible avec le seul roulis de tête qui incline
 * les deux yeux du même côté.
 *
 * Seul l'état de repos porte cette expression. Les états expressifs de la vidéo
 * (clin d'œil, yeux écarquillés, notification) gardent la leur : c'est elle
 * qu'on est venu reproduire.
 *
 * Les amplitudes s'appuient sur bible-strong-avatar-lab, qui expose le même
 * modèle (tête X/Y/Z, largeur et hauteur par œil, écart, angle par œil) : chez
 * eux la largeur va de 0,8 à 2,7 fois le neutre, la hauteur de 0,3 à 1,5, et
 * les angles jusqu'à ±80°. On reste dans cette enveloppe.
 */
/** Enumeres pour que la couche i18n verifie leurs traductions a la compilation. */
export type ExpressionId =
  | 'amoureux'
  | 'bahi'
  | 'furieux'
  | 'degoute'
  | 'sournois'
  | 'reveur'
  | 'malade'
  | 'panique'
  | 'zen'
  | 'ebloui'
  | 'moqueur'
  | 'determine'
  | 'clin'
  | 'charmeur'
  | 'rire'
  | 'penseur'
  | 'malin'
  | 'fatigue'
  | 'gourmand'
  | 'robot'
  | 'pirate'
  | 'dodo'
  | 'hypnotise'
  | 'gene'
  | 'espiegle'
  | 'taquin'
  | 'diablotin'
  | 'complice'
  | 'farceur'
  | 'ricaneur'
  | 'joueur'
  | 'menteur'
  | 'provocateur'
  | 'narquois'
  | 'effronte'
  | 'coquin'
  | 'neutre'
  | 'attentif'
  | 'surpris'
  | 'excite'
  | 'heureux'
  | 'hilare'
  | 'colere'
  | 'triste'
  | 'effraye'
  | 'mefiant'
  | 'confus'
  | 'curieux'
  | 'fier'
  | 'timide'
  | 'blase'
  | 'somnolent'

export interface BotExpression {
  id: ExpressionId
  gaze: HeadGaze
  split: number
  eyes: [EyeCfg, EyeCfg]
}

/** `tilt` en degrés, positif = le haut de la gélule part vers la droite. */
const eye = (w: number, h: number, tilt = 0, open = 1): EyeCfg => ({ w, h, tilt, open })

/** Les deux yeux identiques, inclinaisons en miroir si `tilt` est fourni. */
const pair = (w: number, h: number, tilt = 0, open = 1): [EyeCfg, EyeCfg] => [
  eye(w, h, tilt, open),
  eye(w, h, -tilt, open)
]

export const EXPRESSIONS: BotExpression[] = [
  {
    // la pose relevée image par image sur la vidéo de référence
    id: 'neutre',
    gaze: { ...REST_GAZE },
    split: EYE_SPLIT,
    eyes: [eye(EYE_W, EYE_H), eye(EYE_W, EYE_H)]
  },
  {
    id: 'attentif',
    gaze: { yaw: 4, pitch: 5, roll: -4 },
    split: 16,
    eyes: pair(0.21, 0.44)
  },
  {
    id: 'surpris',
    gaze: { yaw: 3, pitch: -3, roll: 0 },
    split: 19,
    eyes: pair(0.45, 0.47)
  },
  {
    id: 'excite',
    gaze: { yaw: 6, pitch: -14, roll: 0 },
    split: 19.5,
    eyes: pair(0.4, 0.56, -10)
  },
  {
    // yeux plissés en arc : les hauts convergent légèrement
    id: 'heureux',
    gaze: { yaw: 5, pitch: 9, roll: 0 },
    split: 17,
    eyes: pair(0.27, 0.17, 14)
  },
  {
    id: 'hilare',
    gaze: { yaw: 4, pitch: 14, roll: 0 },
    split: 18,
    eyes: pair(0.34, 0.13, 20)
  },
  {
    // hauts des yeux qui convergent fort vers le centre + yeux étrécis
    id: 'colere',
    gaze: { yaw: 3, pitch: 7, roll: 0 },
    split: 17,
    eyes: pair(0.34, 0.15, 30)
  },
  {
    // l'inverse : les hauts divergent, et le regard tombe
    id: 'triste',
    gaze: { yaw: 3, pitch: -13, roll: 0 },
    split: 16,
    eyes: pair(0.22, 0.4, -28)
  },
  {
    id: 'effraye',
    gaze: { yaw: 2, pitch: -20, roll: 0 },
    split: 20.5,
    eyes: pair(0.4, 0.6)
  },
  {
    // un œil franchement plus fermé que l'autre
    id: 'mefiant',
    gaze: { yaw: 12, pitch: 6, roll: -6 },
    split: 16,
    eyes: [eye(0.21, 0.4), eye(0.22, 0.15)]
  },
  {
    // asymétrique sur les deux axes : tailles ET inclinaisons dépareillées.
    // L'œil plissé est volontairement plat (rapport 1,6) : à un rapport proche
    // de 1 il serait rond, et son inclinaison ne se verrait pas.
    id: 'confus',
    gaze: { yaw: -14, pitch: 3, roll: 8 },
    split: 16.5,
    eyes: [eye(0.2, 0.44, -18), eye(0.28, 0.17, 14)]
  },
  {
    // la tête penche : c'est le roulis qui porte la curiosité
    id: 'curieux',
    gaze: { yaw: 16, pitch: -9, roll: -15 },
    split: 16.5,
    eyes: [eye(0.24, 0.46, -8), eye(0.2, 0.38, -8)]
  },
  {
    id: 'fier',
    gaze: { yaw: 5, pitch: 17, roll: 0 },
    split: 17,
    eyes: pair(0.3, 0.15, 18)
  },
  {
    id: 'timide',
    gaze: { yaw: -19, pitch: -14, roll: -7 },
    split: 14,
    eyes: pair(0.17, 0.3)
  },
  {
    // fentes horizontales et regard qui part sur le côté
    id: 'blase',
    gaze: { yaw: -22, pitch: 2, roll: 0 },
    split: 16,
    eyes: pair(0.3, 0.12)
  },
  {
    // paupières à moitié tombées : on passe par `open`, donc l'écrasement
    // vertical à l'écran, le même mécanisme que le clignement
    id: 'somnolent',
    gaze: { yaw: 6, pitch: -9, roll: -3 },
    split: 16,
    eyes: pair(0.2, 0.42, 0, 0.42)
  },
  {
    // pack d'extension : yeux ronds et regard leve, le classique « coeur »
    id: 'amoureux',
    gaze: { yaw: 8, pitch: -6, roll: -4 },
    split: 17,
    eyes: pair(0.3, 0.3)
  },
  {
    id: 'bahi',
    gaze: { yaw: 2, pitch: -10, roll: 0 },
    split: 19.5,
    eyes: pair(0.42, 0.62)
  },
  {
    // un cran au-dessus de `colere` : inclinaison a 34deg, yeux en fentes
    id: 'furieux',
    gaze: { yaw: 3, pitch: 10, roll: 0 },
    split: 16.5,
    eyes: pair(0.36, 0.14, 34)
  },
  {
    // asymetrique : un oeil plisse de travers, l'autre tombe
    id: 'degoute',
    gaze: { yaw: -10, pitch: 4, roll: 5 },
    split: 16,
    eyes: [eye(0.3, 0.13, 16), eye(0.26, 0.36, -6)]
  },
  {
    id: 'sournois',
    gaze: { yaw: -24, pitch: 8, roll: -5 },
    split: 16,
    eyes: pair(0.32, 0.13, 10)
  },
  {
    // paupieres lourdes a 70 %, regard perdu en haut a gauche
    id: 'reveur',
    gaze: { yaw: -16, pitch: -16, roll: -6 },
    split: 16.5,
    eyes: pair(0.2, 0.34, 0, 0.7)
  },
  {
    id: 'malade',
    gaze: { yaw: 4, pitch: -6, roll: 6 },
    split: 15.5,
    eyes: pair(0.28, 0.16, -14)
  },
  {
    id: 'panique',
    gaze: { yaw: 0, pitch: -22, roll: 0 },
    split: 20,
    eyes: pair(0.42, 0.62)
  },
  {
    // fentes calmes, aucun angle : la serenite ne penche pas
    id: 'zen',
    gaze: { yaw: 5, pitch: 5, roll: 0 },
    split: 16.5,
    eyes: pair(0.3, 0.1)
  },
  {
    id: 'ebloui',
    gaze: { yaw: 6, pitch: -18, roll: 0 },
    split: 19,
    eyes: pair(0.38, 0.5, -12)
  },
  {
    // un oeil ferme en tiret large, l'autre bien ouvert : la moquerie
    id: 'moqueur',
    gaze: { yaw: 14, pitch: 4, roll: -8 },
    split: 16,
    eyes: [eye(0.44, 0.09), eye(0.22, 0.42)]
  },
  {
    id: 'determine',
    gaze: { yaw: 4, pitch: 12, roll: 0 },
    split: 17,
    eyes: pair(0.34, 0.18, 22)
  },
  {
    // pack 2 : un oeil en tiret, l'autre ouvert — le clin d'oeil franc
    id: 'clin',
    gaze: { yaw: -8, pitch: 2, roll: 6 },
    split: 16.5,
    eyes: [eye(0.44, 0.09), eye(0.22, 0.42)]
  },
  {
    // paupieres a mi-course et regard de cote : le charmeur
    id: 'charmeur',
    gaze: { yaw: 18, pitch: -4, roll: -3 },
    split: 16.5,
    eyes: pair(0.26, 0.36, 10, 0.55)
  },
  {
    // un cran au-dessus d'hilare : arcs serres fort, tete rejetee en arriere
    id: 'rire',
    gaze: { yaw: 0, pitch: 18, roll: 0 },
    split: 18,
    eyes: pair(0.36, 0.1, 26)
  },
  {
    // regard en haut a gauche, un oeil plisse : il reflechit
    id: 'penseur',
    gaze: { yaw: -18, pitch: -18, roll: -4 },
    split: 16,
    eyes: [eye(0.24, 0.2), eye(0.22, 0.4)]
  },
  {
    // mi-clos satisfait, inclinaison douce : le malin sur de lui
    id: 'malin',
    gaze: { yaw: 10, pitch: 10, roll: 0 },
    split: 16.5,
    eyes: pair(0.32, 0.22, -8, 0.6)
  },
  {
    // paupieres lourdes qui tombent vers l'exterieur, a bout de force
    id: 'fatigue',
    gaze: { yaw: 2, pitch: -4, roll: 0 },
    split: 16,
    eyes: pair(0.24, 0.38, -18, 0.5)
  },
  {
    // arcs joyeux et regard qui plonge : il a vu le gateau
    id: 'gourmand',
    gaze: { yaw: -6, pitch: -8, roll: 0 },
    split: 17,
    eyes: pair(0.28, 0.15, 16)
  },
  {
    // geometrie parfaite, regard droit, zero emotion : le robot
    id: 'robot',
    gaze: { yaw: 0, pitch: 0, roll: 0 },
    split: 17,
    eyes: pair(0.26, 0.26)
  },
  {
    // un oeil ferme net, l'autre rond et vif, tete penchee : le pirate
    id: 'pirate',
    gaze: { yaw: 8, pitch: -2, roll: -10 },
    split: 17,
    eyes: [eye(0.3, 0.08), eye(0.3, 0.5)]
  },
  {
    // presque ferme des deux cotes : il dort pour de bon
    id: 'dodo',
    gaze: { yaw: 4, pitch: -2, roll: 3 },
    split: 15.5,
    eyes: pair(0.2, 0.4, 0, 0.18)
  },
  {
    // deux yeux inclines DANS LE MEME SENS : la tete lui tourne
    id: 'hypnotise',
    gaze: { yaw: -4, pitch: -6, roll: 12 },
    split: 17.5,
    eyes: [eye(0.34, 0.44, 18), eye(0.34, 0.44, 18)]
  },
  {
    // petit, serre, regard en bas a cote : la gene
    id: 'gene',
    gaze: { yaw: -20, pitch: 14, roll: -5 },
    split: 14.5,
    eyes: pair(0.18, 0.26, -12)
  },
  {
    // pack 3, les espiegles : regard de cote et arcs joyeux, il prepare un coup
    id: 'espiegle',
    gaze: { yaw: -20, pitch: 4, roll: -4 },
    split: 16.5,
    eyes: [eye(0.3, 0.16, 12), eye(0.3, 0.14, -12)]
  },
  {
    // un oeil ferme, l'autre en arc moqueur : la taquinerie
    id: 'taquin',
    gaze: { yaw: 12, pitch: 6, roll: 5 },
    split: 16,
    eyes: [eye(0.42, 0.09), eye(0.28, 0.2, 14)]
  },
  {
    // colere en miniature mais regard par en dessous : le petit demon
    id: 'diablotin',
    gaze: { yaw: 4, pitch: -10, roll: 0 },
    split: 16.5,
    eyes: pair(0.34, 0.16, 24)
  },
  {
    // le clin d'oeil enorme du complot, l'autre oeil ecarquille
    id: 'complice',
    gaze: { yaw: 12, pitch: -2, roll: -6 },
    split: 16.5,
    eyes: [eye(0.4, 0.08), eye(0.26, 0.46)]
  },
  {
    // arcs serres et tete rejetee : le farceur vient de pieger quelqu'un
    id: 'farceur',
    gaze: { yaw: -10, pitch: 14, roll: 0 },
    split: 18.5,
    eyes: pair(0.34, 0.12, 22)
  },
  {
    // deux yeux inclines dans le meme sens, il rit sous cape
    id: 'ricaneur',
    gaze: { yaw: 16, pitch: 8, roll: -6 },
    split: 16,
    eyes: [eye(0.3, 0.18, 14), eye(0.28, 0.2, 14)]
  },
  {
    // un oeil grand, un oeil petit : l'envie de jouer lui monte
    id: 'joueur',
    gaze: { yaw: -12, pitch: -4, roll: 8 },
    split: 17,
    eyes: [eye(0.3, 0.44), eye(0.2, 0.3)]
  },
  {
    // regard qui fuit au maximum, yeux petits entrouverts : il ment
    id: 'menteur',
    gaze: { yaw: -24, pitch: 2, roll: 0 },
    split: 15.5,
    eyes: pair(0.24, 0.34, 0, 0.85)
  },
  {
    // menton haut, paupieres lourdes, inclinaison inverse : la provocation
    id: 'provocateur',
    gaze: { yaw: 6, pitch: 16, roll: 0 },
    split: 16.5,
    eyes: pair(0.34, 0.2, -14, 0.65)
  },
  {
    // un oeil mi-clos penche, l'autre placide : la moquerie tranquille
    id: 'narquois',
    gaze: { yaw: 20, pitch: 6, roll: -4 },
    split: 16,
    eyes: [eye(0.24, 0.36, 10, 0.5), eye(0.22, 0.42)]
  },
  {
    // yeux ronds bien ouverts, tete penchee, de face : l'effronte
    id: 'effronte',
    gaze: { yaw: 0, pitch: -12, roll: -8 },
    split: 17.5,
    eyes: pair(0.3, 0.4)
  },
  {
    // arcs joyeux asymetriques et regard fuyant : le coquin classique
    id: 'coquin',
    gaze: { yaw: -14, pitch: 6, roll: -5 },
    split: 16.5,
    eyes: [eye(0.3, 0.15, 18), eye(0.26, 0.13, -16)]
  }
]

export const EXPRESSION_BY_ID = new Map<string, BotExpression>(EXPRESSIONS.map((e) => [e.id, e]))
export const DEFAULT_EXPRESSION = 'neutre'

const lerpEyeCfg = (a: EyeCfg, b: EyeCfg, t: number): EyeCfg => ({
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t),
  open: lerp(a.open, b.open, t)
})

/** Interpolation de deux expressions : le changement se fait en glissant. */
export function blendExpression(a: BotExpression, b: BotExpression, t: number): BotExpression {
  return {
    id: b.id,
    gaze: {
      yaw: lerp(a.gaze.yaw, b.gaze.yaw, t),
      pitch: lerp(a.gaze.pitch, b.gaze.pitch, t),
      roll: lerp(a.gaze.roll, b.gaze.roll, t)
    },
    split: lerp(a.split, b.split, t),
    eyes: [lerpEyeCfg(a.eyes[0], b.eyes[0], t), lerpEyeCfg(a.eyes[1], b.eyes[1], t)]
  }
}
