const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage
} = require('electron')
const path = require('path')
const fs = require('fs')
const { loadConfig, saveConfig } = require('./config')
const { launchAll } = require('./launcher')

// Prevent multiple instances
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let tray = null
let settingsWindow = null

function createTrayIcon() {
  // Load from file if it exists (dev or packaged build)
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(app.getAppPath(), 'resources', 'icon.png')

  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath)
  }

  // Inline fallback: 32x32 RGBA blue square with a white "W"
  const size = 32
  const data = Buffer.alloc(size * size * 4)

  const BG = [41, 98, 255]
  const FG = [255, 255, 255]

  for (let i = 0; i < size * size; i++) {
    data[i * 4] = BG[0]; data[i * 4 + 1] = BG[1]
    data[i * 4 + 2] = BG[2]; data[i * 4 + 3] = 255
  }

  // Simple W pixels
  const pts = [
    [5,6],[5,8],[5,10],[5,12],[5,14],[5,16],[5,18],[5,20],[5,22],
    [7,22],[9,18],[11,14],[11,16],[11,18],[11,20],[11,22],
    [13,22],[13,20],[15,14],[17,18],[17,20],[17,22],
    [19,22],[19,18],[21,14],[21,16],[21,18],[21,20],[21,22],
    [23,22],[23,20],[23,18],[23,16],[23,14],[23,12],[23,10],[23,8],[23,6]
  ]
  for (const [x, y] of pts) {
    if (x < size && y < size) {
      const i = (y * size + x) * 4
      data[i] = FG[0]; data[i + 1] = FG[1]; data[i + 2] = FG[2]; data[i + 3] = 255
    }
  }
  return nativeImage.createFromBuffer(data, { width: size, height: size })
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: '⚡ Launch All',
      click: async () => {
        const config = loadConfig()
        await launchAll(config)
      }
    },
    { type: 'separator' },
    {
      label: '⚙ Settings',
      click: () => openSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit WorkLaunch',
      click: () => app.quit()
    }
  ])
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 760,
    height: 620,
    minWidth: 600,
    minHeight: 500,
    title: 'WorkLaunch Settings',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show()
    settingsWindow.center()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    settingsWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../../out/renderer/index.html'))
  }
}

// IPC handlers
ipcMain.handle('worklaunch:get-config', () => loadConfig())

ipcMain.handle('worklaunch:save-config', (_event, config) => {
  saveConfig(config)
  return { success: true }
})

ipcMain.handle('worklaunch:launch-all', async () => {
  const config = loadConfig()
  return launchAll(config)
})

ipcMain.handle('worklaunch:get-autostart', () => {
  return app.getLoginItemSettings().openAtLogin
})

ipcMain.handle('worklaunch:set-autostart', (_event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
    name: 'WorkLaunch'
  })
  const config = loadConfig()
  config.autoStart = enabled
  saveConfig(config)
  return { success: true }
})

ipcMain.handle('worklaunch:get-version', () => app.getVersion())

app.whenReady().then(() => {
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('WorkLaunch — click to open settings, double-click to launch all')
  tray.setContextMenu(buildTrayMenu())

  // Single click opens settings
  tray.on('click', () => openSettingsWindow())

  // Double-click triggers launch all
  tray.on('double-click', async () => {
    const config = loadConfig()
    await launchAll(config)
  })
})

app.on('second-instance', () => {
  openSettingsWindow()
})

// Keep the app alive in the system tray when all windows are closed
app.on('window-all-closed', () => {
  // Intentionally empty — tray keeps the process alive
})
