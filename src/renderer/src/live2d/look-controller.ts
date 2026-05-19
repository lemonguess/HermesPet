export interface LookVector {
  angleX: number
  angleY: number
  eyeX: number
  eyeY: number
}

export interface LookState {
  current: LookVector
  target: LookVector
}

const NEUTRAL: LookVector = { angleX: 0, angleY: 0, eyeX: 0, eyeY: 0 }

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * clamp(alpha, 0, 1)
}

export function createLookState(): LookState {
  return {
    current: { ...NEUTRAL },
    target: { ...NEUTRAL },
  }
}

export function setLookTargetFromNormalizedPointer(state: LookState, nx: number, ny: number): void {
  const x = clamp(nx, -1, 1)
  const y = clamp(ny, -1, 1)
  state.target = {
    angleX: x * 30,
    angleY: -y * 30,
    eyeX: x,
    eyeY: -y,
  }
}

export function relaxLookTarget(state: LookState): void {
  state.target = { ...NEUTRAL }
}

export function stepLookState(state: LookState, alpha = 0.14): LookVector {
  state.current = {
    angleX: lerp(state.current.angleX, state.target.angleX, alpha),
    angleY: lerp(state.current.angleY, state.target.angleY, alpha),
    eyeX: lerp(state.current.eyeX, state.target.eyeX, alpha),
    eyeY: lerp(state.current.eyeY, state.target.eyeY, alpha),
  }
  return state.current
}
