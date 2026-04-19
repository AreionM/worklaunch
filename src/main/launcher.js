const { execSync, spawn } = require('child_process')
const { Notification, shell } = require('electron')
const fs = require('fs')
const path = require('path')

function isProcessRunning(processName) {
  if (!processName) return false
  try {
    const output = execSync(
      `tasklist /FI "IMAGENAME eq ${processName}" /NH`,
      { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }
    )
    return output.toLowerCase().includes(processName.toLowerCase())
  } catch {
    return false
  }
}

// --- Path resolvers for apps with non-trivial install locations ---

function resolveDiscordExe() {
  // Discord installs versioned dirs: %LOCALAPPDATA%\Discord\app-X.X.X\Discord.exe
  const discordDir = path.join(process.env.LOCALAPPDATA || '', 'Discord')
  if (!fs.existsSync(discordDir)) return null
  try {
    const dirs = fs.readdirSync(discordDir).filter(d => /^app-[\d.]+$/.test(d))
    if (dirs.length === 0) return null
    dirs.sort()
    const exe = path.join(discordDir, dirs[dirs.length - 1], 'Discord.exe')
    return fs.existsSync(exe) ? exe : null
  } catch {
    return null
  }
}

function resolveTeamsPath(configuredPath) {
  if (fs.existsSync(configuredPath)) return { path: configuredPath, args: [] }
  // New Teams (WindowsApps)
  const newTeams = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'ms-teams.exe')
  if (fs.existsSync(newTeams)) return { path: newTeams, args: [] }
  // Old Teams
  const oldTeams = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Teams', 'current', 'Teams.exe')
  if (fs.existsSync(oldTeams)) return { path: oldTeams, args: [] }
  return { path: configuredPath, args: [] }
}

function resolvePowerBIPath(configuredPath) {
  if (fs.existsSync(configuredPath)) return configuredPath
  const x86 = path.join(
    process.env['ProgramFiles(x86)'] || '',
    'Microsoft Power BI Desktop', 'bin', 'PBIDesktop.exe'
  )
  return fs.existsSync(x86) ? x86 : configuredPath
}

function resolveClaudePath(configuredPath) {
  if (fs.existsSync(configuredPath)) return configuredPath
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'AnthropicClaude', 'claude.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Claude', 'claude.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Claude', 'claude.exe'),
    path.join(process.env.ProgramFiles || '', 'Anthropic', 'Claude', 'claude.exe'),
  ]
  return candidates.find(p => fs.existsSync(p)) || configuredPath
}

// --- Main launch logic ---

function buildLaunchCommand(item) {
  // Returns { launchPath, launchArgs } with correct values per app type
  if (item.id === 'discord') {
    // Prefer direct Discord.exe; fall back to Update.exe launcher
    const directExe = resolveDiscordExe()
    if (directExe) return { launchPath: directExe, launchArgs: [] }
    // Update.exe --processStart Discord.exe
    return { launchPath: item.path, launchArgs: item.args || [] }
  }
  if (item.id === 'teams') {
    const resolved = resolveTeamsPath(item.path)
    return { launchPath: resolved.path, launchArgs: resolved.args }
  }
  if (item.id === 'powerbi') {
    return { launchPath: resolvePowerBIPath(item.path), launchArgs: item.args || [] }
  }
  if (item.id === 'claude') {
    return { launchPath: resolveClaudePath(item.path), launchArgs: item.args || [] }
  }
  return { launchPath: item.path, launchArgs: item.args || [] }
}

function launchApp(item) {
  const { launchPath, launchArgs } = buildLaunchCommand(item)
  const child = spawn(launchPath, launchArgs, {
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
      try {
        launchUrl(item.path)
        results.launched.push(item.name)
      } catch (err) {
        results.failed.push(`${item.name} (${err.message})`)
      }
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
  logResults(results)
  return results
}

function logResults(results) {
  if (results.launched.length) console.log('[WorkLaunch] Launched:', results.launched.join(', '))
  if (results.skipped.length) console.log('[WorkLaunch] Already running:', results.skipped.join(', '))
  if (results.failed.length) console.error('[WorkLaunch] Failed:', results.failed.join(', '))
}

function showNotification(results) {
  if (!Notification.isSupported()) return

  const parts = []
  if (results.launched.length) parts.push(`Launched: ${results.launched.join(', ')}`)
  if (results.skipped.length) parts.push(`Already running: ${results.skipped.join(', ')}`)
  if (results.failed.length) parts.push(`Failed: ${results.failed.join(', ')}`)

  const body = parts.length ? parts.join('\n') : 'Nothing to launch.'

  const notif = new Notification({ title: 'WorkLaunch', body, silent: true })
  notif.show()
}

module.exports = { launchAll, isProcessRunning }
