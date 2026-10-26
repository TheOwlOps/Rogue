<script setup lang="ts">
import { ref } from 'vue'
import BotTile from '@/components/BotTile.vue'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLORS, SHAPES } from '@/bot/skins'
import { t } from '@/i18n'

const shape = defineModel<string>('shape', { required: true })
const color = defineModel<string>('color', { required: true })
const expression = defineModel<string>('expression', { required: true })

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1

/**
 * Combinaisons pretes a l'emploi : un clic pose la forme, la couleur et le
 * visage d'un coup. Les noms restent en anglais dans les trois langues — ce
 * sont des noms de personnages, pas des libelles d'interface.
 */
const PRESETS: Array<{ name: string; shape: string; color: string; expression: string }> = [
  { name: 'Classic', shape: 'cercle', color: 'encre', expression: 'neutre' },
  { name: 'Cosmos', shape: 'etoile', color: 'saphir', expression: 'reveur' },
  { name: 'Candy', shape: 'coeur', color: 'corail', expression: 'amoureux' },
  { name: 'Citrus', shape: 'soleil', color: 'citron', expression: 'ebloui' },
  { name: 'Forest', shape: 'blob', color: 'emeraude', expression: 'zen' },
  { name: 'Royal', shape: 'diamant', color: 'prune', expression: 'determine' },
  { name: 'Sakura', shape: 'fleur', color: 'rose', expression: 'heureux' },
  { name: 'Ocean', shape: 'goutte', color: 'ciel', expression: 'attentif' },
  { name: 'Lava', shape: 'triangle', color: 'rouge', expression: 'furieux' },
  { name: 'Honey', shape: 'hexagone', color: 'ambre', expression: 'excite' },
  { name: 'Grape', shape: 'galet', color: 'violet', expression: 'sournois' },
  { name: 'Mint', shape: 'squircle', color: 'menthe', expression: 'curieux' },
  { name: 'Storm', shape: 'nuage', color: 'ardoise', expression: 'mefiant' },
  { name: 'Panda', shape: 'ovale', color: 'creme', expression: 'somnolent' },
  { name: 'Peachy', shape: 'poire', color: 'peche', expression: 'timide' },
  { name: 'Cyber', shape: 'carre', color: 'cyan', expression: 'confus' },
  { name: 'Vamp', shape: 'capsule', color: 'bordeaux', expression: 'moqueur' },
  { name: 'Lemon', shape: 'pilule', color: 'or', expression: 'surpris' },
  { name: 'Matcha', shape: 'pentagone', color: 'kaki', expression: 'blase' },
  { name: 'Choco', shape: 'octogone', color: 'chocolat', expression: 'fier' },
  { name: 'Bubblegum', shape: 'cercle', color: 'fuchsia', expression: 'hilare' },
  { name: 'Lagoon', shape: 'capsule', color: 'turquoise', expression: 'bahi' },
  { name: 'Sunset', shape: 'ovale', color: 'orange', expression: 'triste' },
  { name: 'Ghost', shape: 'blob', color: 'argent', expression: 'effraye' }
]

/**
 * La bande « cute » : couleurs pastel ou bonbon, formes douces (cœur, fleur,
 * nuage, poire…), visages heureux ou timides. Noms de personnages kawaii —
 * ils restent en anglais dans les trois langues, comme les autres presets.
 */
const CUTE_PRESETS: Array<{ name: string; shape: string; color: string; expression: string }> = [
  { name: 'Mochi', shape: 'galet', color: 'creme', expression: 'heureux' },
  { name: 'Pudding', shape: 'poire', color: 'peche', expression: 'timide' },
  { name: 'Cupcake', shape: 'fleur', color: 'rose', expression: 'excite' },
  { name: 'Boba', shape: 'cercle', color: 'lavande', expression: 'reveur' },
  { name: 'Mimi', shape: 'squircle', color: 'menthe', expression: 'zen' },
  { name: 'Kiki', shape: 'etoile', color: 'ciel', expression: 'hilare' },
  { name: 'Peach', shape: 'nuage', color: 'saumon', expression: 'bahi' },
  { name: 'Bunny', shape: 'ovale', color: 'lilas', expression: 'amoureux' },
  { name: 'Tofu', shape: 'carre', color: 'sable', expression: 'somnolent' },
  { name: 'Berry', shape: 'blob', color: 'fuchsia', expression: 'curieux' },
  { name: 'Waffle', shape: 'hexagone', color: 'ambre', expression: 'ebloui' },
  { name: 'Momo', shape: 'goutte', color: 'corail', expression: 'moqueur' }
]

function applyPreset(p: (typeof PRESETS)[number]) {
  shape.value = p.shape
  color.value = p.color
  expression.value = p.expression
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!

function randomize() {
  shape.value = pick(SHAPES).id
  color.value = pick(COLORS).id
  expression.value = pick(EXPRESSIONS).id
}

/**
 * Lien de partage : la combinaison tient dans le hash (`#avatar=forme.couleur
 * .visage`), relue par `App.vue` a l'arrivee — aucun stockage cote serveur.
 */
const shared = ref(false)
let sharedTimer = 0
async function share() {
  const url = `${location.origin}${location.pathname}#avatar=${shape.value}.${color.value}.${expression.value}`
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    location.hash = `avatar=${shape.value}.${color.value}.${expression.value}`
  }
  shared.value = true
  clearTimeout(sharedTimer)
  sharedTimer = window.setTimeout(() => (shared.value = false), 2000)
}
</script>

<template>
  <div>
    <div class="flex gap-1.5">
      <button
        type="button"
        class="flex-1 cursor-pointer rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium transition hover:bg-black/5"
        @click="randomize"
      >
        🎲 {{ t('panel.random') }}
      </button>
      <button
        type="button"
        class="flex-1 cursor-pointer rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium transition hover:bg-black/5"
        @click="share"
      >
        {{ shared ? '✓ ' + t('panel.shared') : '🔗 ' + t('panel.share') }}
      </button>
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.presets') }}</h2>
    <div class="mt-2 grid grid-cols-3 gap-1.5">
      <BotTile
        v-for="p in PRESETS"
        :key="p.name"
        :label="p.name"
        :selected="p.shape === shape && p.color === color && p.expression === expression"
        :shape="p.shape"
        :color="p.color"
        :expression="p.expression"
        :frozen-at="PREVIEW_AT"
        @click="applyPreset(p)"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.cute') }} 🧸</h2>
    <div class="mt-2 grid grid-cols-3 gap-1.5">
      <BotTile
        v-for="p in CUTE_PRESETS"
        :key="p.name"
        :label="p.name"
        :selected="p.shape === shape && p.color === color && p.expression === expression"
        :shape="p.shape"
        :color="p.color"
        :expression="p.expression"
        :frozen-at="PREVIEW_AT"
        @click="applyPreset(p)"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.shape') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="s in SHAPES"
        :key="s.id"
        :label="t(`shapes.${s.id}`)"
        :selected="s.id === shape"
        :shape="s.id"
        :color="color"
        :expression="expression"
        :frozen-at="PREVIEW_AT"
        @click="shape = s.id"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.expression') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="e in EXPRESSIONS"
        :key="e.id"
        :label="t(`expressions.${e.id}`)"
        :selected="e.id === expression"
        :shape="shape"
        :color="color"
        :expression="e.id"
        :frozen-at="PREVIEW_AT"
        @click="expression = e.id"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.color') }}</h2>
    <div class="mt-2 grid grid-cols-6 gap-1.5">
      <button
        v-for="c in COLORS"
        :key="c.id"
        type="button"
        class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
        :class="
          c.id === color ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'
        "
        :aria-label="t(`colors.${c.id}`)"
        :aria-pressed="c.id === color"
        @click="color = c.id"
      >
        <!-- liseré interne : sinon la pastille creme disparait sur fond clair -->
        <span
          class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
          :style="{ background: c.hex }"
        />
      </button>
    </div>
  </div>
</template>
