# Expansion pack (v0.2) — 100 new catalogue entries

The original catalogue is *measured* off the reference video: 14 states,
8 shapes, 16 expressions, 12 colours. This pack adds **100 chosen entries**
on top — designed, not measured — that recombine the same vocabulary
(radial profiles, orbit rings, particles, coloured dots) without touching
a single measured constant.

| Family | Before | Added | Now |
|---|---|---|---|
| Animation states | 14 | **52** | 66 (+ `swirl`, the UI transition) |
| Customiser shapes | 8 | **12** | 20 |
| Rest expressions | 16 | **12** | 28 |
| Colours | 12 | **24** | 36 |
| **Total added** | | **100** | |

Design rules that keep the engine's invariants intact:

- No new state is `baseBody` or `baseFace` — its silhouette and face *are*
  the animation — so the eye-fit table in `eyefit.ts` does not grow and
  customiser shapes never leak into the new states.
- Every new shape stays inside the safe envelope (radial min ≥ 0.55,
  max ≤ 1.35). The eye-containment sweep in `skins.test.ts` now sweeps
  20 shapes × 29 faces × 5 base states × 60 instants (2,900 combinations)
  and still finds zero overflow.
- New expressions respect the tilt rule: a tilted eye is always elongated
  enough for the tilt to read (enforced by `expressions.test.ts`).
- Every entry has a label in French, English and Chinese
  (`i18n.test.ts` checks the catalogues entry by entry).

## The 52 new states

**Motion** — `bounce` (squash-and-stretch hop in place), `dance` (side-to-side
sway), `spin` (full turn with two orbiting satellites), `flip` (a somersault
with a mid-air squash), `wiggle` (jelly wobble), `swing` (pendulum), `hop`
(repeated jumps with landing squash), `float` (slow levitation, zen eyes),
`drift` (lissajous wander), `roll` (rolls sideways and back).

**Shape morphs** — `star`, `heart` (double-thump heartbeat), `diamond`,
`square` (slowly rotating superellipse), `pentagon`, `octagon`, `flower`
(six rotating petals), `sun` (twelve rotating rays), `blob` (organic
three-harmonic wobble), `wave` (travelling undulation), `gear` (rotating
teeth), `planet` (Saturn ring + orbiting moon dot).

**Emotions** — `dizzy` (gaze circling), `laugh` (shaking, slit eyes), `cry`
(blue tears falling), `love` (rising pink dots, beating scale), `angry`
(trembling, 30° mirrored tilts), `shocked` (shrunk body, huge eyes), `yawn`
(lids sinking shut mid-cycle), `peek` (gaze swinging left-right), `sneeze`
(wind-up with closing eyes, spray burst, recovery), `proud` (stretched tall),
`bashful` (shrunk, blush dots), `ponder` (thought bubbles rising).

**Effects** — `rainbow` (the orbit rings with hues rotating), `fireworks`
(three coloured bursts), `sparkle` (twinkling ring of dots), `rain`
(blue drops), `snow` (drifting flakes), `bubbles` (rising bubbles),
`confetti` (coloured pieces falling), `halo` (one flat golden ring),
`sonar` (two expanding dot rings), `portal` (rings closing in, body pulsing),
`galaxy` (five tilted orbits), `meteor` (the comet mirrored, ribbons reversed).

**Objects** — `rocket` (triangle body, flickering exhaust), `ufo` (wide disc,
blinking rim lights), `robot` (stepwise gaze, antenna light), `ghost`
(wavy hem, floating), `vinyl` (spinning disc, red label dot, groove rings),
`target` (centred gaze, red target dots).

## The 12 new shapes

`etoile` (soft five-point star), `carre` (high-exponent superellipse),
`diamant` (low-exponent superellipse), `pentagone`, `octogone`, `coeur`
(fat heart: two lobes ∪ point triangle, radial max), `soleil` (12-ray wavy
disc), `fleur` (six petals), `ovale` (wide ellipse), `pilule` (vertical
capsule), `poire` (two-circle pear), `blob` (free harmonic pebble).

## The 12 new expressions

`amoureux` (in love), `bahi` (awestruck), `furieux` (furious — 34° tilts),
`degoute` (disgusted, asymmetric), `sournois` (sly), `reveur` (dreamy,
lids at 70 %), `malade` (sick), `panique` (panicked), `zen` (calm slits),
`ebloui` (dazzled), `moqueur` (teasing — one eye a dash, one wide),
`determine` (determined — 22° tilts).

## The 24 new colours

`corail, saumon, peche, menthe, ciel, lavande, lilas, fuchsia, bordeaux,
olive, kaki, sable, chocolat, ardoise, marine, cyan, magenta, citron,
prune, argent, or, cuivre, emeraude, saphir`.

## Verification

- `pnpm build` (vue-tsc) clean.
- Full vitest suite green, including `src/bot/expansion.test.ts`
  (counts lock: exactly 100 additions; every new state renders a finite,
  in-viewBox frame at nine instants, is a pure function of time, and
  actually animates).
- `#planche` shows all 66 states frozen side by side.
