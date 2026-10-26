import { useEffect, useRef } from 'react'
import {
  createAvatar,
  type AvatarHandle,
  type ChatPhase,
  type StateId
} from '@theowlops/rogue-avatar-core'

export interface RogueAvatarProps {
  /** What the bot is doing — the chat-app API. Wins over `state`. */
  phase?: ChatPhase
  /** A single engine state (66 available, see `STATES` in core). */
  state?: StateId
  /** Pixel size (square). Default 96. */
  size?: number
  /** Shape id from the core catalogue. */
  shape?: string
  /** Colour id from the core catalogue. */
  color?: string
  /** Rest-expression id from the core catalogue. */
  expression?: string
  /** Background colour behind the avatar (the eyes see through to it). */
  paper?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Animated bot avatar for React chat apps.
 *
 * ```tsx
 * <RogueAvatar phase={botBusy ? 'working' : 'idle'} size={40} />
 * ```
 */
export function RogueAvatar(props: RogueAvatarProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<AvatarHandle | null>(null)
  const { phase, state, size = 96, shape, color, expression, paper } = props

  useEffect(() => {
    if (!hostRef.current) return
    const handle = createAvatar(hostRef.current, { size, shape, color, expression, paper })
    handleRef.current = handle
    return () => {
      handle.destroy()
      handleRef.current = null
    }
    // Mount once; live props are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const h = handleRef.current
    if (!h) return
    if (phase) h.setPhase(phase)
    else if (state) h.setState(state)
  }, [phase, state])

  useEffect(() => {
    if (shape) handleRef.current?.setShape(shape)
  }, [shape])
  useEffect(() => {
    if (color) handleRef.current?.setColor(color)
  }, [color])
  useEffect(() => {
    if (expression) handleRef.current?.setExpression(expression)
  }, [expression])

  return (
    <div
      ref={hostRef}
      className={props.className}
      style={{ width: size, height: size, flex: 'none', ...props.style }}
    />
  )
}
