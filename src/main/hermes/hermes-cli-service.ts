import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { HermesCliResult, HermesGatewayStatus } from '@shared/types'
import { checkHermesCliAvailable, gatewayRestart, gatewayStart, gatewayStatus, gatewayStop, listHermesProfiles } from './hermes-cli'

export class HermesCliService {
  register(): void {
    ipcMain.handle(IPC.HermesCli.Check, () => checkHermesCliAvailable())
    ipcMain.handle(IPC.HermesCli.ListProfiles, async (): Promise<string[]> => {
      const { profiles } = await listHermesProfiles()
      return profiles
    })
    ipcMain.handle(IPC.HermesCli.GatewayStatus, async (_event, profile: string): Promise<HermesGatewayStatus> => {
      const { running, raw } = await gatewayStatus(profile)
      return { profile, running, raw }
    })
    ipcMain.handle(IPC.HermesCli.GatewayStart, async (_event, profile: string): Promise<HermesCliResult> => {
      return gatewayStart(profile)
    })
    ipcMain.handle(IPC.HermesCli.GatewayStop, async (_event, profile: string): Promise<HermesCliResult> => {
      return gatewayStop(profile)
    })
    ipcMain.handle(IPC.HermesCli.GatewayRestart, async (_event, profile: string): Promise<HermesCliResult> => {
      return gatewayRestart(profile)
    })
  }
}

