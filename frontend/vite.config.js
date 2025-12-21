import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';
import electron from 'vite-plugin-electron/simple';
import VueDevTools from 'vite-plugin-vue-devtools';
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const isDev = process.env.NODE_ENV !== 'production';

// Plugin to copy static assets with fixed names
const copyStaticAssets = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  return {
    name: 'copy-static-assets',
    writeBundle() {
      if (!isDev) {
        const outDir = join(__dirname, 'dist-electron', 'dist');
        const buildIcon = join(__dirname, 'build', 'icon.png');
        const srcSplash = join(__dirname, 'src', 'assets', 'splash-mockup.png');
        const outAssetsDir = join(outDir, 'assets');
        
        try {
          if (existsSync(buildIcon)) {
            copyFileSync(buildIcon, join(outDir, 'icon.png'));
          }
          if (existsSync(srcSplash) && existsSync(outAssetsDir)) {
            copyFileSync(srcSplash, join(outAssetsDir, 'splash-mockup.png'));
          }
        } catch (err) {
          console.warn('Failed to copy static assets:', err.message);
        }
      }
    },
  };
};

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    // Only include Vue DevTools in development mode
    ...(isDev ? [VueDevTools()] : []),
    copyStaticAssets(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: 'electron/main/main.js',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            minify: true,
            sourcemap: false,
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`
        input: 'electron/preload/preload.mjs',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      // Remove renderer option to avoid dependency issues
      // renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-electron/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        activation: 'activation.html',
        splash: 'splash.html',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  base: './',
});
