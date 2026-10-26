/**
 * `@theowlops/rogue-avatar-core` — public API.
 *
 * Three layers, in order of abstraction:
 *
 * 1. **Chat phases + player** (`createAvatar`, `setPhase`) — what chat apps
 *    should use: mount an avatar, tell it what the bot is doing.
 * 2. **Renderer** (`renderFrame`, `frameToSvg`) — a sampled frame to SVG
 *    markup, for SSR, snapshots, or your own render loop.
 * 3. **The engine and catalogues** (`BotEngine`, `STATES`, `SHAPES`,
 *    `COLORS`, `EXPRESSIONS`) — the full low-level surface: a pure,
 *    clock-free animation engine (`sample(t)` is a function of time only)
 *    plus the complete catalogue of 66 states, 20 shapes, 52 expressions
 *    and 36 colours.
 */
export { createAvatar, showcaseCycle, type AvatarHandle, type AvatarOptions } from './player.js'
export { renderFrame, frameToSvg, type RenderOptions } from './render.js'
export { CHAT_PHASE_PLANS, phasePlan, type ChatPhase, type PhasePlan } from './chat.js'

export { BotEngine, type BotFrame, type Look, type RenderedEye } from './bot/engine.js'
export {
  STATES,
  STATE_BY_ID,
  POSES,
  SEQUENCE,
  type StateId,
  type StateDef,
  type Pose
} from './bot/states.js'
export {
  SHAPES,
  SHAPE_BY_ID,
  COLORS,
  COLOR_BY_ID,
  DEFAULT_SHAPE,
  DEFAULT_COLOR,
  mixHex,
  type BotShape,
  type BotColor,
  type ShapeId,
  type ColorId
} from './bot/skins.js'
export {
  EXPRESSIONS,
  EXPRESSION_BY_ID,
  DEFAULT_EXPRESSION,
  type BotExpression,
  type ExpressionId
} from './bot/expressions.js'
export {
  defaultCycle,
  makeBlock,
  blockAt,
  offsetOf,
  type Block,
  type Cycle
} from './bot/cycles.js'
export { RAYON, DEMI_VIEWBOX } from './bot/repere.js'
export { NOTIF_BLUE, type DotRender, type ArcRender } from './bot/decor.js'
