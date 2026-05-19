import { execFile } from 'child_process'
import { promisify } from 'util'
import type { HermesCliResult } from '@shared/types'

const execFileAsync = promisify(execFile)

export interface RunHermesOptions {
  profile?: string
  timeoutMs?: number
}

async function runHermes(args: string[], options: RunHermesOptions = {}): Promise<HermesCliResult> {
  const fullArgs = options.profile ? ['--profile', options.profile, ...args] : args
  try {
    const { stdout, stderr } = await execFileAsync('hermes', fullArgs, {
      timeout: options.timeoutMs ?? 20_000,
      windowsHide: true,
      env: process.env,
    })
    return { ok: true, stdout: stdout ?? '', stderr: stderr ?? '' }
  } catch (err: any) {
    const stdout = typeof err?.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err?.stderr === 'string' ? err.stderr : (err instanceof Error ? err.message : String(err))
    return { ok: false, stdout, stderr }
  }
}

export async function checkHermesCliAvailable(): Promise<boolean> {
  const res = await runHermes(['--version'], { timeoutMs: 5_000 })
  return res.ok
}

export async function listHermesProfiles(): Promise<{ profiles: string[]; raw: HermesCliResult }> {
  const raw = await runHermes(['profile', 'list'], { timeoutMs: 10_000 })
  if (!raw.ok) return { profiles: ['default'], raw }

  const profiles: string[] = []
  for (const line of raw.stdout.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('Profile')) continue
    if (trimmed.startsWith('─')) continue
    const m = trimmed.match(/^(?:◆\s*)?([^\s]+)\s*/)
    if (m?.[1]) profiles.push(m[1])
  }

  return { profiles: profiles.length ? profiles : ['default'], raw }
}

function inferGatewayRunning(raw: HermesCliResult): boolean {
  const text = `${raw.stdout}\n${raw.stderr}`.toLowerCase()
  if (text.includes('running')) return true
  if (text.includes('active')) return true
  if (text.includes('started')) return true
  if (text.includes('stopped')) return false
  if (text.includes('inactive')) return false
  return raw.ok
}

export async function gatewayStatus(profile: string): Promise<{ running: boolean; raw: HermesCliResult }> {
  const raw = await runHermes(['gateway', 'status'], { profile, timeoutMs: 10_000 })
  return { running: inferGatewayRunning(raw), raw }
}

export async function gatewayStart(profile: string): Promise<HermesCliResult> {
  return runHermes(['gateway', 'start'], { profile, timeoutMs: 20_000 })
}

export async function gatewayStop(profile: string): Promise<HermesCliResult> {
  return runHermes(['gateway', 'stop'], { profile, timeoutMs: 20_000 })
}

export async function gatewayRestart(profile: string): Promise<HermesCliResult> {
  const raw = await runHermes(['gateway', 'restart'], { profile, timeoutMs: 30_000 })
  if (raw.ok) return raw
  const stop = await gatewayStop(profile)
  if (!stop.ok) return stop
  return gatewayStart(profile)
}

