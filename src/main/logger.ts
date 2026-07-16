import log from 'electron-log/main'
import { app } from 'electron'
import path from 'path'

// File-based logger for field diagnostics. Writes to {userData}/logs/metacasting.log
// so a trainer can retrieve it after a failure — even once the app has closed and
// the in-memory Logs page buffer is gone. Rotates to metacasting.old.log at maxSize.
//
// Log content stays in English (internal), unlike the Spanish end-user UI.
export function initLogger(): void {
  log.transports.file.fileName = 'metacasting.log'
  log.transports.file.level = 'info'
  log.transports.file.maxSize = 5 * 1024 * 1024 // 5 MB, then rotates (keeps one old file)

  // Route renderer-side logs through the same file, and capture uncaught errors.
  log.initialize()
  log.errorHandler.startCatching({ showDialog: false })

  log.info(`===== MetaCasting v${app.getVersion()} started =====`)
}

export function getLogFilePath(): string {
  return log.transports.file.getFile().path
}

export function getLogDir(): string {
  return path.dirname(getLogFilePath())
}

// Shared logger instance for the rest of the main process.
export const logger = log
