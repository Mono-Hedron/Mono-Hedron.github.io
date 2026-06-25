import { defineConfig } from 'vite';
import { join, dirname, relative } from 'path';
import { readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { katexAlignedToPhantomPlugin } from './katex-aligned-to-phantom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, 'src');
const compDir = join(srcDir, 'assets', 'components');

function getHtmlEntries(dir, allEntries = {}) {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const fullPath = join(dir, file);
    if (file === 'assets') return;

    if (statSync(fullPath).isDirectory()) {
      getHtmlEntries(fullPath, allEntries);
    } else if (file.endsWith('.html')) {
      const relativePath = relative(srcDir, fullPath);
      const entryKey = relativePath.replace(/\.html$/, '').replaceAll('\\', '/');
      allEntries[entryKey] = fullPath;
    }
  });
  return allEntries;
}

export default defineConfig({
  base: '/',
  root: srcDir,
  publicDir: join(__dirname, 'public'),
  plugins: [
    katexAlignedToPhantomPlugin(),
    ViteEjsPlugin((_viteConfig) => {
      return {
        fromComponents: (...paths) => join(compDir, ...paths),
      };
    }),
  ],

  build: {
    outDir: join(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: getHtmlEntries(srcDir),
    },
  },

  server: {
    // port: 3000,
    open: true,
  },
});
