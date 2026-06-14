// Clears ELECTRON_RUN_AS_NODE (inherited from VS Code) before starting electron-vite.
// Without this, Electron starts in Node.js-compat mode and electron.app is undefined.
const { spawn } = require('child_process')
const path = require('path')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const evBin = path.join(__dirname, '..', 'node_modules', '.bin', 'electron-vite')
const cmd = process.platform === 'win32' ? `"${evBin}.cmd" dev` : `"${evBin}" dev`

const proc = spawn(cmd, { stdio: 'inherit', env, shell: true })
proc.on('close', (code) => process.exit(code ?? 0))
