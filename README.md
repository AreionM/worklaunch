# WorkLaunch

A Windows system tray app that launches all your work tools — apps and websites — in one click. Lives quietly in the taskbar, never opens a duplicate if something's already running.

## What it does

- Sits in the system tray (bottom-right taskbar area)
- **Left-click** the tray icon → opens Settings
- **Double-click** the tray icon → launches all enabled items immediately
- **Right-click** the tray icon → context menu: **Launch All** / **Settings** / **Quit**
- Before launching each app, checks running processes via `tasklist` — skips if already running
- Shows a Windows toast notification reporting what was launched vs skipped
- Optional: start automatically with Windows (toggle in Settings)

## Default configured items

| App | Process checked |
|-----|----------------|
| Opera GX | `opera.exe` |
| Discord | `Discord.exe` |
| Microsoft Teams | `ms-teams.exe` |
| Power BI Desktop | `PBIDesktop.exe` |
| Claude Desktop | `claude.exe` |

Paths are auto-detected for common install locations. Discord's versioned directory is resolved automatically. If any path doesn't match your install, edit it in Settings.

## How to install (pre-built)

1. Download the latest `WorkLaunch-Setup-x.x.x.exe` from [Releases](../../releases)
2. Run the installer (per-user, no admin required)
3. WorkLaunch appears in your system tray
4. Right-click the icon → **Settings** to review and adjust app paths

## How to build from source

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [Git](https://git-scm.com/)

### Steps

```bash
# Clone the repo
git clone https://github.com/AreionM/worklaunch.git
cd worklaunch

# Install dependencies
npm install

# (Optional) Regenerate the app icon
node scripts/generate-icon.js

# Run in development mode — launches Electron live with hot-reload
npm start

# Build production bundles only (no installer)
npm run build

# Build + create Windows installer (.exe) in dist/
npm run dist:win
```

## How to add a new launch item

### Via the Settings UI (recommended)

1. Click the tray icon to open Settings, or right-click → **Settings**
2. Click **+ Add Item**
3. Fill in:
   - **Name** — display label shown in the list
   - **Type** — `app` for a desktop app, `website` for a URL
   - **Path / URL** — full path to the `.exe`, or a URL for websites
   - **Process Name** — the `.exe` name as it appears in Task Manager (apps only; used for duplicate detection)
   - **Arguments** — optional space-separated command-line flags
4. Click **Add Item**, then **Save Config**

### Via the config file

Config lives at `%APPDATA%\worklaunch\config.json`. You can edit it directly while the app is closed:

```json
{
  "items": [
    {
      "id": "slack",
      "name": "Slack",
      "type": "app",
      "path": "C:\\Users\\YourName\\AppData\\Local\\slack\\slack.exe",
      "args": [],
      "processName": "slack.exe",
      "enabled": true
    },
    {
      "id": "my-dashboard",
      "name": "Dashboard",
      "type": "website",
      "path": "https://dashboard.example.com",
      "processName": "",
      "enabled": true
    }
  ],
  "autoStart": false
}
```

## Project structure

```
worklaunch/
├── src/
│   ├── main/
│   │   ├── index.js              Main process — tray, windows, IPC handlers
│   │   ├── launcher.js           Process detection + launching logic
│   │   └── config.js             Config read/write at %APPDATA%/worklaunch/
│   ├── preload/
│   │   └── index.js              Electron contextBridge API bridge
│   └── renderer/
│       ├── index.html            Settings window shell
│       ├── main.jsx              React entry point
│       ├── App.jsx               Main settings UI
│       └── components/
│           ├── ItemRow.jsx       Sortable launch item row
│           └── ItemModal.jsx     Add/edit item modal
├── assets/
│   └── icon.png                  App icon (256×256 PNG)
├── scripts/
│   └── generate-icon.js          Generates assets/icon.png from pure Node.js
├── electron.vite.config.js       Build config (electron-vite)
├── electron-builder.config.js    Packaging config (Windows NSIS installer)
├── package.json
└── README.md
```

## Tech stack

| Tool | Purpose |
|------|---------|
| **Electron** v33 | Desktop shell, system tray, IPC |
| **React** v18 | Settings window UI |
| **@dnd-kit** | Drag-to-reorder in settings |
| **electron-vite** | Dev server + production build |
| **electron-builder** | Windows NSIS installer packaging |

## License

MIT
