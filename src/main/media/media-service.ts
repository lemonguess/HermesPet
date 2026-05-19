import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { MediaImportRequest, MediaImportResult, MediaPart } from '@shared/types'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'default'
}

function inferMediaTypeByExt(filePath: string): MediaPart['type'] {
  const ext = extname(filePath).toLowerCase()
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return 'image'
  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(ext)) return 'audio'
  if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) return 'video'
  return 'file'
}

export class MediaService {
  register(): void {
    ipcMain.handle(IPC.Media.Import, async (_event, req: MediaImportRequest): Promise<MediaImportResult> => {
      if (!req?.sourcePath) throw new Error('sourcePath is required')
      if (!req?.conversationId) throw new Error('conversationId is required')

      const baseDir = resolve(join(homedir(), 'HermesPet_Media'))
      const convDir = resolve(join(baseDir, safeSegment(req.conversationId)))
      if (!convDir.startsWith(baseDir)) throw new Error('Invalid conversationId')
      if (!existsSync(convDir)) mkdirSync(convDir, { recursive: true })

      const ext = extname(req.sourcePath)
      const stem = safeSegment(basename(req.sourcePath, ext))
      const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${stem}${ext}`
      const destPath = resolve(join(convDir, name))
      if (!destPath.startsWith(convDir)) throw new Error('Invalid destPath')

      copyFileSync(req.sourcePath, destPath)

      const type = inferMediaTypeByExt(destPath)
      const src = pathToFileURL(destPath).toString()
      return { part: { kind: 'media', type, src } }
    })
  }
}

