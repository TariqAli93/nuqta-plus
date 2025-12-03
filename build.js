// git add .
// git commit -m "Update build script to include publishing step"
// git tag v1.0.6
// git push origin main --tags
// git push origin v1.0.6
// export GH_TOKEN="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"
// yarn build

import { build } from 'electron-builder';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// read build section in package.json
// "build": {
//     "appId": "com.nuqtaplus.app",
//     "productName": "نقطة بلس",
//     "files": [
//       "package.json",
//       "dist-electron/**/*",
//       "node_modules/**/*",
//       "backend/**/*"
//     ],
//     "extraResources": [
//       {
//         "from": "../../dist-backend",
//         "to": "backend",
//         "filter": [
//           "**/*"
//         ]
//       },
//       {
//         "from": "dist-electron",
//         "to": "dist-electron",
//         "filter": [
//           "**/*"
//         ]
//       },
//       {
//         "from": "../backend/node_modules",
//         "to": "backend/node_modules",
//         "filter": [
//           "**/*"
//         ]
//       },
//       {
//         "from": "./activation.html",
//         "to": "dist-electron/dist/activation.html"
//       },
//       {
//         "from": "./electron/scripts",
//         "to": "dist-electron/scripts"
//       }
//     ],
//     "directories": {
//       "buildResources": "build",
//       "output": "../../release"
//     },
//     "publish": [
//       {
//         "provider": "github",
//         "owner": "TariqAli93",
//         "repo": "nuqtaplus",
//         "releaseType": "release"
//       }
//     ],
//     "win": {
//       "target": [
//         "nsis"
//       ],
//       "icon": "build/icon.ico",
//       "artifactName": "NuqtaPlus-Setup-${version}.exe"
//     },
//     "nsis": {
//       "oneClick": false,
//       "allowToChangeInstallationDirectory": true,
//       "createDesktopShortcut": true,
//       "createStartMenuShortcut": true,
//       "shortcutName": "نقطة بلس",
//       "installerHeader": "build/installer-header.bmp",
//       "installerSidebar": "build/installer-sidebar.bmp",
//       "uninstallerIcon": "build/icon.ico",
//       "uninstallDisplayName": "نقطة بلس",
//       "license": "build/license.md",
//       "unicode": true
//     }
//   }

// build({
//   config: {
//     appId: 'com.nuqtaplus.app',
//     productName: 'نقطة بلس',
//     files: [
//       'package.json',
//       'dist-electron/**/*',
//       'node_modules/**/*',
//       'backend/**/*'
//     ],
//     extraResources: [
//       {
//         from: '../../dist-backend',
//         to: 'backend',
//         filter: [
//           '**/*'
//         ]
//       },
//       {
//         from: 'dist-electron',
//         to: 'dist-electron',
//         filter: [
//           '**/*'
//         ]
//       },
//       {
//         from: '../backend/node_modules',
//         to: 'backend/node_modules',
//         filter: [
//           '**/*'
//         ]
//       },
//       {
//         from: './activation.html',
//         to: 'dist-electron/dist/activation.html'
//       },
//       {
//         from: './electron/scripts',
//         to: 'dist-electron/scripts'
//       }
//     ],
//     directories: {
//       buildResources: 'build',
//       output: '../../release'
//     },
//     publish: [
//       {
//         provider: 'github',
//         owner: 'TariqAli93',
//         repo: 'nuqtaplus',
//         releaseType: 'release'
//       }
//     ],
//     win: {
//       target: [
//         'nsis'
//       ],
//       icon: 'build/icon.ico',
//       artifactName: 'NuqtaPlus-Setup-${version}.exe'
//     },
//     nsis: {
//       oneClick: false,
//       allowToChangeInstallationDirectory: true,
//       createDesktopShortcut: true,
//       createStartMenuShortcut: true,
//       shortcutName: 'نقطة بلس',
//       installerHeader: 'build/installer-header.bmp',
//       installerSidebar: 'build/installer-sidebar.bmp',
//       uninstallerIcon: 'build/icon.ico',
//       uninstallDisplayName: 'نقطة بلس',
//       license: 'build/license.md',
//       unicode: true
//     }
//   }
// }).then(() => {
//   console.log('Build and publish complete!');
// }).catch((error) => {
//   console.error('Error during build and publish:', error);
// });
