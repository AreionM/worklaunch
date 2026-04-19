/**
 * electron-builder configuration
 * https://www.electron.build/configuration/configuration
 */

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.alchemyintel.worklaunch',
  productName: 'WorkLaunch',

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
    icon: 'assets/icon.png'
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false
  }
}
