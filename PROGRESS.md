# WorkLaunch Build Progress

Last updated: 2026-04-19

## Status: Milestone 5 — All code written, built successfully

## Completed steps

- [x] **Milestone 1 — Project scaffolded**
  - Cloned repo into D:\Work\worklaunch
  - Created directory structure: src/main, src/preload, src/renderer/src/components, resources, scripts
  - package.json with electron, electron-vite, react, @dnd-kit deps
  - electron.vite.config.js
  - electron-builder.yml
  - .gitignore

- [x] **Milestone 2 — Main process built**
  - src/main/index.js — tray creation, context menu, settings window, IPC handlers
  - src/main/config.js — config read/write at %APPDATA%/worklaunch/config.json
  - src/main/launcher.js — process detection via tasklist, spawning apps, Windows notifications
  - src/preload/index.js — contextBridge exposing electronAPI to renderer

- [x] **Milestone 3 — Launcher logic built**
  - isProcessRunning() using tasklist /FI
  - Path resolution for Discord (versioned dirs), Power BI (x86 fallback), Teams (new/old)
  - launchAll() iterates items, checks running state, spawns or skips
  - showNotification() using Electron's Notification class

- [x] **Milestone 4 — React UI built**
  - src/renderer/index.html
  - src/renderer/src/main.jsx
  - src/renderer/src/App.jsx — full settings UI with drag-reorder, enable/disable toggles, launch result toast
  - src/renderer/src/components/ItemRow.jsx — sortable row with edit/delete
  - src/renderer/src/components/ItemModal.jsx — add/edit modal
  - scripts/generate-icon.js — pure Node.js 256x256 PNG generator

- [x] **Milestone 5 — Build successful**
  - npm install succeeded with vite@5.x (vite 6 not yet supported by electron-vite)
  - npm run build succeeds: main (4.28 kB), preload (0.72 kB), renderer (350 kB)
  - resources/icon.png generated (256x256, 816 bytes)

## What's next

- [x] Push all code to main branch on GitHub
- [ ] Test `npm start` (requires display — Aaron to verify on his PC)
- [ ] Optional: run `npm run dist:win` to produce installer

## Manual steps for Aaron

1. `cd D:\Work\worklaunch && npm start` — launches the app in dev mode
2. Check the system tray for the WorkLaunch icon
3. Update app paths in Settings if any don't match your installation (especially Discord's versioned path and Power BI)
4. To build installer: `npm run dist:win`

## Key decisions made

- Used **electron-vite** for dev/build tooling (standard for modern Electron apps)
- Used **vite 5.x** not 6.x (electron-vite 2.3.0 requires vite 4 or 5)
- Icon created in-memory via nativeImage RGBA buffer (no external image library)
- Discord path auto-resolves the versioned `app-X.X.X` directory
- Power BI checks both Program Files and Program Files (x86)
- Teams checks both new (`ms-teams.exe`) and old (`Teams.exe`) locations
- Config stored at `%APPDATA%/worklaunch/config.json` — survives app updates
- Single-instance enforcement via `app.requestSingleInstanceLock()`
- App stays alive in tray (empty `window-all-closed` handler)
