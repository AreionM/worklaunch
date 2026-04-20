/**
 * electron-builder configuration
 * https://www.electron.build/configuration/configuration
 */

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.alchemyintel.worklaunch',
  productName: 'Work Launcher',
  executableName: 'Work Launcher',

  directories: {
    buildResources: 'build',
    output: 'dist'
  },

  files: [
    'out/**/*',
    'assets/icon.png'
  ],

  extraResources: [
    { from: 'assets/icon.png', to: 'icon.png' }
  ],

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.png',
    // No code-signing certificate — skip winCodeSign download entirely
    sign: null,
    signingHashAlgorithms: null
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false
  }
}
