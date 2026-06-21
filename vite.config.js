import { defineConfig } from 'vite';
import { join, dirname, relative, sep } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compDir = join(__dirname, 'src', 'components');
const nsImport = readFileSync(join(compDir, 'ns-import.html'), 'utf8');
const header = readFileSync(join(compDir, 'header.html'), 'utf8');
const footer = readFileSync(join(compDir, 'footer.html'), 'utf8');


function getHtmlEntries(dir, allEntries = {}) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const fullPath = join(dir, file);
    if (file === 'components') return;
    
    if (statSync(fullPath).isDirectory()) {
      getHtmlEntries(fullPath, allEntries);
    } else if (file.endsWith('.html')) {
      const relativePath = relative(join(__dirname, 'src'), fullPath);
      const entryKey = relativePath.replace(/\.html$/, '').replace(/\\/g, '/');
      allEntries[entryKey] = fullPath;
    }
  });
  return allEntries;
}

export default defineConfig({
  base: '/',
  root: join(__dirname, 'src'), 
  
  plugins: [

    {
      name: 'html-placeholder-replacer',
      transformIndexHtml(html, ctx) {
        const filename = ctx.filename;
        const relativeFromSrc = relative(join(__dirname, 'src'), dirname(filename));
        
        let rootPath = '.';
        if (relativeFromSrc) {
          const depth = relativeFromSrc.split(sep).length;
          rootPath = Array(depth).fill('..').join('/');
        }

        let content = html;
        content = content.replace('<!-- BUILD-PLACEHOLDER:NS-IMPORT -->', nsImport);
        content = content.replace('<!-- BUILD-PLACEHOLDER:HEADER -->', header);
        content = content.replace('<!-- BUILD-PLACEHOLDER:FOOTER -->', footer);

        content = content.replaceAll('{{ROOT}}', rootPath);

        return content;
      }
    }
  ],
  
  build: {
    outDir: join(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: getHtmlEntries(join(__dirname, 'src')),
    },
    
  },
  
  server: {
    port: 3000,
    open: true,
  }
});