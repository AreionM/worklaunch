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

// Prevent multiple instances — second launch opens Settings instead
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let tray = null
let settingsWindow = null

function createTrayIcon() {
  // Primary: load from assets/icon.png (dev) or resources/icon.png (packaged)
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(app.getAppPath(), 'assets', 'icon.png')

  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath)
  }

  // Inline fallback: build a 32x32 blue icon in memory (no file needed)
  const size = 32
  const data = Buffer.alloc(size * size * 4)
  const BG = [41, 98, 255]
  const FG = [255, 255, 255]

  for (let i = 0; i < size * size; i++) {
    data[i * 4] = BG[0]; data[i * 4 + 1] = BG[1]
    data[i * 4 + 2] = BG[2]; data[i * 4 + 3] = 255
  }
  const wPts = [
    [5,6],[5,8],[5,10],[5,12],[5,14],[5,16],[5,18],[5,20],[5,22],
    [7,22],[9,18],[11,14],[11,16],[11,18],[11,20],[11,22],
    [13,22],[13,20],[15,14],[17,18],[17,20],[17,22],
    [19,22],[19,18],[21,14],[21,16],[21,18],[21,20],[21,22],
    [23,22],[23,20],[23,18],[23,16],[23,14],[23,12],[23,10],[23,8],[23,6]
  ]
  for (const [x, y] of wPts) {
    const idx = (y * size + x) * 4
    data[idx] = FG[0]; data[idx + 1] = FG[1]; data[idx + 2] = FG[2]; data[idx + 3] = 255
  }
  return nativeImage.createFromBuffer(data, { width: size, height: size })
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Launch All',
      click: async () => {
        const config = loadConfig()
        await launchAll(config)
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => openSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit',
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

  // In dev mode electron-vite sets ELECTRON_RENDERER_URL; in prod load the built file
  if (process.env.ELECTRON_RENDERER_URL) {
    settingsWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../../out/renderer/index.html'))
  }
}

function getAutoStart() {
  try {
    return app.getLoginItemSettings().openAtLogin
  } catch {
    return false
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

ipcMain.handle('worklaunch:get-autostart', () => getAutoStart())

ipcMain.handle('worklaunch:set-autostart', (_event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      name: 'WorkLaunch'
    })
  } catch {
    // setLoginItemSettings may fail in dev mode — that's OK
  }
  const config = loadConfig()
  config.autoStart = enabled
  saveConfig(config)
  return { success: true }
})

ipcMain.handle('worklaunch:get-version', () => app.getVersion())

app.whenReady().then(() => {
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('WorkLaunch — right-click for menu, double-click to launch all')
  tray.setContextMenu(buildTrayMenu())

  tray.on('click', () => openSettingsWindow())
  tray.on('double-click', async () => {
    const config = loadConfig()
    await launchAll(config)
  })
})

app.on('second-instance', () => {
  openSettingsWindow()
})

// Keep running in the tray after settings window is closed
app.on('window-all-closed', () => {
  // Intentionally empty — tray keeps the process alive
})
