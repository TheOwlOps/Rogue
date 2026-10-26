<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  createAvatar,
  type AvatarHandle,
  type ChatPhase,
  type StateId
} from '@theowlops/rogue-avatar-core'

/**
 * Animated bot avatar for Vue chat apps.
 *
 * ```vue
 * <RogueAvatar :phase="botBusy ? 'working' : 'idle'" :size="40" />
 * ```
 */
const props = withDefaults(
  defineProps<{
    /** What the bot is doing — the chat-app API. Wins over `state`. */
    phase?: ChatPhase
    /** A single engine state (66 available, see `STATES` in core). */
    state?: StateId
    /** Pixel size (square). */
    size?: number
    shape?: string
    color?: string
    expression?: string
    paper?: string
  }>(),
  { size: 96 }
)

const host = ref<HTMLElement | null>(null)
let handle: AvatarHandle | null = null

onMounted(() => {
  if (!host.value) return
  handle = createAvatar(host.value, {
    size: props.size,
    shape: props.shape,
    color: props.color,
    expression: props.expression,
    paper: props.paper
  })
  if (props.phase) handle.setPhase(props.phase)
  else if (props.state) handle.setState(props.state)
})

watch(
  () => [props.phase, props.state] as const,
  ([phase, state]) => {
    if (!handle) return
    if (phase) handle.setPhase(phase)
    else if (state) handle.setState(state)
  }
)
watch(
  () => props.shape,
  (s) => s && handle?.setShape(s)
)
watch(
  () => props.color,
  (c) => c && handle?.setColor(c)
)
watch(
  () => props.expression,
  (e) => e && handle?.setExpression(e)
)

onBeforeUnmount(() => {
  handle?.destroy()
  handle = null
})
</script>

<template>
  <div ref="host" :style="{ width: `${size}px`, height: `${size}px`, flex: 'none' }" />
</template>
