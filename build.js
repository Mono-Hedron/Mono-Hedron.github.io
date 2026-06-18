import { existsSync, rmSync, mkdirSync, readFileSync, readdirSync, statSync, cpSync, writeFileSync } from 'fs';
import { join, extname, dirname} from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)


const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');
const compDir = join(srcDir, 'components');


if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir);


const importmap = readFileSync(join(compDir, 'importmap.html'), 'utf8');
const header = readFileSync(join(compDir, 'header.html'), 'utf8');
const footer = readFileSync(join(compDir, 'footer.html'), 'utf8');


readdirSync(srcDir).forEach(item => {
    const srcPath = join(srcDir, item);
    const distPath = join(distDir, item);


    if (item === 'components') return;

    if (statSync(srcPath).isDirectory()) {
        cpSync(srcPath, distPath, { recursive: true });
        console.log(`Folder copy: dist/${item}`);
    } else if (extname(item) === '.html') {

        let content = readFileSync(srcPath, 'utf8');
        content = content.replace('<!-- BUILD-PLACEHOLDER:IMPORTMAP -->', importmap);
        content = content.replace('<!-- BUILD-PLACEHOLDER:HEADER -->', header);
        content = content.replace('<!-- BUILD-PLACEHOLDER:FOOTER -->', footer);
        
        writeFileSync(distPath, content, 'utf8');
        console.log(`HTML build: dist/${item}`);
    }
});

// Root files
const root_files = [
    'third-party-notice.md',
    'favicon.ico',
]
root_files.forEach((filename)=>{
    const filePath = join(__dirname, filename);
    const filePathDist = join(distDir, filename)
    cpSync(filePath, filePathDist)
    console.log(`Root file copy: dist/${filename}`);
})