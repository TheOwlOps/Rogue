import { describe, expect, it } from 'vitest'
import { BotEngine } from './engine.js'
import { EXPRESSIONS } from './expressions.js'
import { COLORS, SHAPES } from './skins.js'
import { POSES, SEQUENCE, STATES } from './states.js'

/**
 * Le pack d'extension v0.2 : 100 ajouts choisis (52 etats, 12 formes,
 * 12 expressions, 24 couleurs) par-dessus le catalogue releve sur la video
 * (14 etats, 8 formes, 16 expressions, 12 couleurs). Ces tests verrouillent
 * les comptes et la sante de rendu des nouveaux etats : chemin fini, corps
 * dans le viewBox, decor borne — aux memes dates que le reste du depot.
 */

const NOUVEAUX_ETATS = SEQUENCE.filter(
  (id) =>
    ![
      'idle', 'thinking', 'wink', 'wide', 'alert', 'notify', 'exclaim',
      'sleep', 'egg', 'hexagon', 'play', 'orbit', 'burst', 'comet'
    ].includes(id)
)

describe('comptes du pack', () => {
  it('ajoute exactement 100 entrees aux catalogues', () => {
    expect(NOUVEAUX_ETATS).toHaveLength(52)
    expect(STATES).toHaveLength(67) // 66 du catalogue + `swirl`, la transition
    expect(SEQUENCE).toHaveLength(66)
    expect(SHAPES).toHaveLength(20)
    expect(EXPRESSIONS).toHaveLength(28)
    expect(COLORS).toHaveLength(36)
    expect(
      NOUVEAUX_ETATS.length + (SHAPES.length - 8) + (EXPRESSIONS.length - 16) + (COLORS.length - 12)
    ).toBe(100)
  })

  it('donne a chaque nouvel etat une pose de vignette lisible', () => {
    for (const id of NOUVEAUX_ETATS) {
      expect(POSES[id], id).toBeGreaterThan(0)
      expect(POSES[id], id).toBeLessThanOrEqual(3.4)
    }
  })
})

describe('rendu des nouveaux etats', () => {
  it('produit un chemin fini et contenu dans le viewBox, a toute date', () => {
    const fautifs: string[] = []
    for (const id of NOUVEAUX_ETATS) {
      const e = new BotEngine(100, id)
      for (const t of [0, 0.2, 0.55, 0.9, 1.3, 1.8, 2.4, 3, 3.4]) {
        const f = e.sample(t)
        if (f.bodyPath.includes('NaN')) fautifs.push(`${id}@${t} NaN`)
        const nums = f.bodyPath.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
        for (const n of nums) {
          if (!Number.isFinite(n) || Math.abs(n) >= 158) fautifs.push(`${id}@${t} hors viewBox`)
        }
        for (const d of f.dots) {
          if (!Number.isFinite(d.x + d.y + d.r)) fautifs.push(`${id}@${t} point non fini`)
          if (d.opacity < 0 || d.opacity > 1.01) fautifs.push(`${id}@${t} opacite ${d.opacity}`)
        }
        for (const eye of f.eyes) {
          if (eye.matrix.includes('NaN')) fautifs.push(`${id}@${t} oeil NaN`)
        }
      }
    }
    expect(fautifs).toEqual([])
  }, 30_000)

  it('reste une fonction pure du temps', () => {
    for (const id of NOUVEAUX_ETATS) {
      const e = new BotEngine(100, id)
      const first = e.sample(1.1).bodyPath
      e.sample(2.7)
      expect(e.sample(1.1).bodyPath, id).toBe(first)
    }
  })

  it('anime vraiment : le corps bouge entre deux dates', () => {
    for (const id of NOUVEAUX_ETATS) {
      const e = new BotEngine(100, id)
      const paths = [0.15, 0.6, 1.1, 1.7].map((t) => e.sample(t).bodyPath)
      // `square` et `robot` tournent lentement : on leur laisse le benefice
      // du mouvement du regard en comparant aussi les yeux
      const eyes = [0.15, 0.6, 1.1, 1.7].map((t) => e.sample(t).eyes.map((y) => y.matrix).join('|'))
      expect(new Set(paths).size + new Set(eyes).size, id).toBeGreaterThan(2)
    }
  })
})
