const { execSync, spawn } = require('child_process')
const { Notification, shell } = require('electron')
const fs = require('fs')
const path = require('path')

function isProcessRunning(processName) {
  try {
    const output = execSync(
      `tasklist /FI "IMAGENAME eq ${processName}" /NH 2>NUL`,
      { encoding: 'utf8', windowsHide: true }
    )
    return output.toLowerCase().includes(processName.toLowerCase())
  } catch {
    return false
  }
}

function resolveDiscordPath(configuredPath) {
  // Discord installs versioned app directories: app-X.X.X/Discord.exe
  const discordDir = path.join(process.env.LOCALAPPDATA || '', 'Discord')
  if (!fs.existsSync(discordDir)) return configuredPath
  try {
    const dirs = fs.readdirSync(discordDir).filter(d => /^app-[\d.]+$/.test(d))
    if (dirs.length === 0) return configuredPath
    dirs.sort()
    const latest = dirs[dirs.length - 1]
    const exe = path.join(discordDir, latest, 'Discord.exe')
    if (fs.existsSync(exe)) return exe
  } catch {
    // fall through
  }
  return configuredPath
}

function resolvePowerBIPath(configuredPath) {
  if (fs.existsSync(configuredPath)) return configuredPath
  const alt = path.join(
    process.env['ProgramFiles(x86)'] || '',
    'Microsoft Power BI Desktop',
    'bin',
    'PBIDesktop.exe'
  )
  return fs.existsSync(alt) ? alt : configuredPath
}

function resolveTeamsPath(configuredPath) {
  if (fs.existsSync(configuredPath)) return configuredPath
  const oldTeams = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'Teams',
    'current',
    'Teams.exe'
  )
  return fs.existsSync(oldTeams) ? oldTeams : configuredPath
}

function resolvePath(item) {
  if (item.id === 'discord') return resolveDiscordPath(item.path)
  if (item.id === 'powerbi') return resolvePowerBIPath(item.path)
  if (item.id === 'teams') return resolveTeamsPath(item.path)
  return item.path
}

function launchApp(item) {
  const resolvedPath = resolvePath(item)
  const args = item.args || []

  // For Discord launched via Update.exe, use the configured path (Update.exe) + args
  const launchPath = (item.id === 'discord' && !fs.existsSync(resolvedPath))
    ? item.path
    : resolvedPath

  const child = spawn(launchPath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  })
  child.unref()
}

function launchUrl(url) {
  shell.openExternal(url)
}

async function launchAll(config) {
  const results = { launched: [], skipped: [], failed: [] }

  for (const item of config.items) {
    if (!item.enabled) continue

    if (item.type === 'website') {
      launchUrl(item.path)
      results.launched.push(item.name)
      continue
    }

    const running = isProcessRunning(item.processName)
    if (running) {
      results.skipped.push(item.name)
      continue
    }

    try {
      launchApp(item)
      results.launched.push(item.name)
    } catch (err) {
      results.failed.push(`${item.name} (${err.message})`)
    }
  }

  showNotification(results)
  return results
}

function showNotification(results) {
  if (!Notification.isSupported()) return

  const parts = []
  if (results.launched.length > 0) parts.push(`Launched: ${results.launched.join(', ')}`)
  if (results.skipped.length > 0) parts.push(`Already running: ${results.skipped.join(', ')}`)
  if (results.failed.length > 0) parts.push(`Failed: ${results.failed.join(', ')}`)

  const body = parts.length > 0 ? parts.join('\n') : 'Nothing to launch.'

  const notif = new Notification({
    title: 'WorkLaunch',
    body,
    silent: true
  })
  notif.show()
}

module.exports = { launchAll, isProcessRunning }
