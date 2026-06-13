import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          control: resolve(__dirname, 'src/preload/control.ts'),
          output: resolve(__dirname, 'src/preload/output.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
        '@control': resolve(__dirname, 'src/renderer/control'),
        '@output': resolve(__dirname, 'src/renderer/output')
      }
    },
    build: {
      rollupOptions: {
        input: {
          control: resolve(__dirname, 'src/renderer/control/index.html'),
          output: resolve(__dirname, 'src/renderer/output/index.html')
        }
      }
    }
  }
})
