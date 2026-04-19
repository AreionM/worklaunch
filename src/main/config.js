const { app } = require('electron')
const path = require('path')
const fs = require('fs')

function getConfigPath() {
  const dir = path.join(app.getPath('appData'), 'worklaunch')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'config.json')
}

function getDefaultConfig() {
  const local = process.env.LOCALAPPDATA || ''
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'

  return {
    items: [
      {
        id: 'opera-gx',
        name: 'Opera GX',
        type: 'app',
        path: path.join(local, 'Programs', 'Opera GX', 'opera.exe'),
        args: [],
        processName: 'opera.exe',
        enabled: true
      },
      {
        id: 'discord',
        name: 'Discord',
        type: 'app',
        path: path.join(local, 'Discord', 'Update.exe'),
        args: ['--processStart', 'Discord.exe'],
        processName: 'Discord.exe',
        enabled: true
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        type: 'app',
        path: path.join(local, 'Microsoft', 'WindowsApps', 'ms-teams.exe'),
        args: [],
        processName: 'ms-teams.exe',
        enabled: true
      },
      {
        id: 'powerbi',
        name: 'Power BI Desktop',
        type: 'app',
        path: path.join(programFiles, 'Microsoft Power BI Desktop', 'bin', 'PBIDesktop.exe'),
        args: [],
        processName: 'PBIDesktop.exe',
        enabled: true
      },
      {
        id: 'claude',
        name: 'Claude Desktop',
        type: 'app',
        path: path.join(local, 'AnthropicClaude', 'claude.exe'),
        args: [],
        processName: 'claude.exe',
        enabled: true
      }
    ],
    autoStart: false
  }
}

function loadConfig() {
  const configPath = getConfigPath()
  if (!fs.existsSync(configPath)) {
    const defaults = getDefaultConfig()
    fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf8')
    return defaults
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return getDefaultConfig()
  }
}

function saveConfig(config) {
  const configPath = getConfigPath()
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
}

module.exports = { loadConfig, saveConfig, getConfigPath }
