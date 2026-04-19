# WorkLaunch — Build Status

**Date:** 2026-04-19  
**Repo:** https://github.com/AreionM/worklaunch  
**Branch:** main

---

## What has been completed

### Project scaffold
- `package.json` — Electron 33, React 18, @dnd-kit, electron-vite, vite 5.x, electron-builder
- `electron.vite.config.js` — build config for main/preload/renderer
- `electron-builder.yml` — Windows NSIS installer packaging config
- `.gitignore` — excludes node_modules, dist, out

### Main process (Electron)
- `src/main/index.js` — system tray icon (inline 32×32 RGBA + file fallback), right-click context menu (Launch All / Settings / Quit), settings window, IPC handlers, single-instance lock
- `src/main/config.js` — reads/writes `%APPDATA%\worklaunch\config.json`, default config for 5 apps
- `src/main/launcher.js` — process detection via `tasklist`, smart path resolution for Discord (versioned dirs), Power BI (x86 fallback), Teams (new vs old), Windows toast notifications
- `src/preload/index.js` — contextBridge API exposing getConfig, saveConfig, launchAll, getAutoStart, setAutoStart, getVersion

### React settings UI
- `src/renderer/index.html` — dark-themed shell
- `src/renderer/src/main.jsx` — React 18 root mount
- `src/renderer/src/App.jsx` — full settings UI with drag-to-reorder, enable/disable toggles, Launch All button, inline result toast, auto-start toggle, Save Config button
- `src/renderer/src/components/ItemRow.jsx` — @dnd-kit/sortable row with edit/delete buttons and type badge
- `src/renderer/src/components/ItemModal.jsx` — add/edit modal (name, type, path, processName, args)

### Assets and tooling
- `scripts/generate-icon.js` — pure Node.js 256×256 PNG generator (no external deps, uses zlib)
- `resources/icon.png` — pre-generated 256×256 blue icon committed to repo

### Documentation
- `README.md` — full documentation: install, build from source, add items, project structure, tech stack
- `PROGRESS.md` — build milestone tracker

---

## Files that exist in the repo

```
worklaunch/
├── .gitignore
├── PROGRESS.md
├── README.md
├── STATUS.md                      ← this file
├── electron-builder.yml
├── electron.vite.config.js
├── package-lock.json
├── package.json
├── resources/
│   └── icon.png
├── scripts/
│   └── generate-icon.js
└── src/
    ├── main/
    │   ├── config.js
    │   ├── index.js
    │   └── launcher.js
    ├── preload/
    │   └── index.js
    └── renderer/
        ├── index.html
        └── src/
            ├── App.jsx
            ├── main.jsx
            └── components/
                ├── ItemModal.jsx
                └── ItemRow.jsx
```

---

## Commits pushed to GitHub

| Hash | Message |
|------|---------|
| `5e6e0e7` | feat: add icon generator and project docs |
| `b73707d` | feat: add React settings UI with drag-reorder and full CRUD |
| `15bd7ad` | feat: add Electron main process, config, and launcher modules |
| `01b7393` | chore: scaffold project with Electron+React+electron-vite stack |
| `e910eb0` | Initial commit (pre-existing) |

All 4 new commits are live at https://github.com/AreionM/worklaunch/commits/main

---

## What still remains to be done

- **Test `npm start` on Aaron's machine** — requires a display/GUI. The build (`npm run build`) succeeds cleanly, but the running app has not been verified visually.
- **Update exe paths in Settings** — default paths are best-guess for common install locations. Aaron will need to verify and fix any that don't match his system (especially Discord's versioned path like `app-1.0.9154/Discord.exe`).
- **Optional: build installer** — run `npm run dist:win` to produce a `dist/WorkLaunch-Setup-1.0.0.exe` installer. Requires `node_modules` installed.
- **Optional: create GitHub Release** — upload the built installer to GitHub Releases for easy re-install.

---

## Issues encountered

| Issue | Resolution |
|-------|-----------|
| `npm install` failed — vite 6 not supported by electron-vite 2.3.0 | Pinned to vite 5.4.x in package.json |
| `git push` over HTTPS timed out (no credential helper configured) | Switched remote URL to SSH (`git@github.com:...`); SSH key `~/.ssh/id_ed25519` was already registered with GitHub as `AreionM` |

---

## How to run when you're ready

```bash
cd D:\Work\worklaunch
npm start          # dev mode — launches Electron live
npm run build      # production build only (no installer)
npm run dist:win   # build + create Windows installer in dist/
```
