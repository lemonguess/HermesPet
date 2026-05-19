import { ipcMain } from 'electron'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { IPC } from '@shared/ipc-channels'
import type { HermesDashboardModule, HermesDashboardSummary, HermesLogFile, HermesModelGroup } from '@shared/types'
import { checkHermesCliAvailable, gatewayStatus, listHermesProfiles } from './hermes-cli'

function hermesBaseDir(): string {
  return process.env.HERMES_HOME || join(homedir(), '.hermes')
}

function activeProfileName(): string {
  try {
    const raw = readFileSync(join(hermesBaseDir(), 'active_profile'), 'utf-8').trim()
    return raw || 'default'
  } catch {
    return 'default'
  }
}

function profileDir(profile: string): string {
  if (!profile || profile === 'default') return hermesBaseDir()
  const dir = join(hermesBaseDir(), 'profiles', profile)
  return existsSync(dir) ? dir : hermesBaseDir()
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function readDefaultModel(profile: string): string {
  try {
    const content = readFileSync(join(profileDir(profile), 'config.yaml'), 'utf-8')
    const objectDefault = content.match(/^\s*default:\s*["']?([^"'\n#]+)["']?/m)?.[1]?.trim()
    if (objectDefault) return objectDefault
    return content.match(/^\s*model:\s*["']?([^"'\n#]+)["']?/m)?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)))
}

function modelsFromAuth(profile: string): HermesModelGroup[] {
  const auth = readJson(join(profileDir(profile), 'auth.json')) as Record<string, unknown> | null
  const currentModel = readDefaultModel(profile)
  const groups: HermesModelGroup[] = []
  const providers = auth?.providers && typeof auth.providers === 'object' ? auth.providers : {}
  const credentialPool = auth?.credential_pool && typeof auth.credential_pool === 'object' ? auth.credential_pool : {}

  for (const [provider, raw] of Object.entries(providers)) {
    const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
    const models = unique([
      ...(Array.isArray(data.models) ? data.models.map(String) : []),
      ...(typeof data.model === 'string' ? [data.model] : []),
    ])
    groups.push({
      provider,
      label: provider,
      models,
      current: !!currentModel && models.includes(currentModel),
    })
  }

  for (const [provider, raw] of Object.entries(credentialPool)) {
    if (groups.some(group => group.provider === provider)) continue
    const entries = Array.isArray(raw) ? raw : []
    const models = unique(entries.flatMap(entry => {
      if (!entry || typeof entry !== 'object') return []
      const data = entry as Record<string, unknown>
      if (Array.isArray(data.models)) return data.models.map(String)
      return typeof data.model === 'string' ? [data.model] : []
    }))
    groups.push({
      provider,
      label: provider,
      models,
      current: !!currentModel && models.includes(currentModel),
    })
  }

  if (groups.length === 0 && currentModel) {
    groups.push({ provider: 'config', label: 'config.yaml', models: [currentModel], current: true })
  }

  return groups
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${bytes}B`
}

function listLogFilesForProfile(profile: string, userDataPath: string): HermesLogFile[] {
  const dirs = [
    join(profileDir(profile), 'logs'),
    join(hermesBaseDir(), 'logs'),
    join(userDataPath, 'hermespet', 'logs'),
  ]
  const out: HermesLogFile[] = []
  const seen = new Set<string>()

  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (seen.has(path)) continue
      seen.add(path)
      try {
        const stat = statSync(path)
        if (!stat.isFile()) continue
        out.push({
          name: basename(path),
          path,
          size: formatSize(stat.size),
          modified: stat.mtime.toLocaleString(),
        })
      } catch {
        // ignore disappearing log files
      }
    }
  }

  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function dashboardModules(): HermesDashboardModule[] {
  return [
    { id: 'chat', label: '对话', status: 'available', detail: '本地 Bridge 对话与图片附件已接入' },
    { id: 'gateways', label: '网关', status: 'partial', detail: '支持 profile 级 status/start/stop/restart' },
    { id: 'models', label: '模型', status: 'partial', detail: '从 Hermes profile auth/config 只读发现模型' },
    { id: 'logs', label: '日志', status: 'partial', detail: '从 Hermes profile 日志目录只读列出文件' },
    { id: 'usage', label: '用量', status: 'planned', detail: '需要读取 Hermes/Web UI usage store 后补图表' },
    { id: 'skills', label: '技能', status: 'planned', detail: '需要接 Hermes skills/plugins 目录与配置' },
    { id: 'memory', label: '记忆', status: 'planned', detail: '需要接 profile memory/user/soul 文件' },
  ]
}

export class HermesDashboardService {
  constructor(private readonly userDataPath: string) {}

  register(): void {
    ipcMain.handle(IPC.HermesDashboard.Models, async (): Promise<HermesModelGroup[]> => {
      return modelsFromAuth(activeProfileName())
    })
    ipcMain.handle(IPC.HermesDashboard.Logs, async (): Promise<HermesLogFile[]> => {
      return listLogFilesForProfile(activeProfileName(), this.userDataPath)
    })
    ipcMain.handle(IPC.HermesDashboard.Summary, async (): Promise<HermesDashboardSummary> => {
      const activeProfile = activeProfileName()
      const cliAvailable = await checkHermesCliAvailable()
      const { profiles } = await listHermesProfiles()
      let gateway = null
      if (cliAvailable) {
        try {
          const { running, raw } = await gatewayStatus(activeProfile)
          gateway = { profile: activeProfile, running, raw }
        } catch {
          gateway = null
        }
      }
      return {
        cliAvailable,
        activeProfile,
        profiles,
        gateway,
        models: modelsFromAuth(activeProfile),
        logs: listLogFilesForProfile(activeProfile, this.userDataPath),
        modules: dashboardModules(),
      }
    })
  }
}
