import { existsSync, rmSync, mkdirSync, readFileSync, readdirSync, statSync, cpSync, writeFileSync, copyFileSync } from 'fs';
import { join, extname, dirname, sep, relative} from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

// Folder name
const COMPONENTS = 'components'
const ASSETS = 'assets'
// Placeholders
const ROOT_PH = '{{ROOT}}'



const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');
const compDir = join(srcDir, COMPONENTS);

const importmap = readFileSync(join(compDir, 'importmap.html'), 'utf8');
const nsImport = readFileSync(join(compDir, 'ns-import.html'), 'utf8');
const header = readFileSync(join(compDir, 'header.html'), 'utf8');
const footer = readFileSync(join(compDir, 'footer.html'), 'utf8');


if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir);


function buildDirectory(currentSrcDir, currentDistDir) {
    if (!existsSync(currentDistDir)) mkdirSync(currentDistDir);

    readdirSync(currentSrcDir).forEach(item => {
        const currentSrcPath = join(currentSrcDir, item);
        const distPath = join(currentDistDir, item);

        if (item === COMPONENTS) return;
        if (item === ASSETS) {
            cpSync(currentSrcPath, distPath, { recursive: true });
            return;
        }

        if (statSync(currentSrcPath).isDirectory()) {
            buildDirectory(currentSrcPath, distPath);
        } else {
            if (extname(item) === '.html') {
                const relativeFromSrc = relative(srcDir, currentSrcDir);
                
                let rootPath = '.';
                if (relativeFromSrc) {
                    const depth = relativeFromSrc.split(sep).length;
                    rootPath = Array(depth).fill('..').join('/');
                }

                const localImportmap = importmap.replaceAll(ROOT_PH, rootPath);
                const localNsImport = nsImport.replace(ROOT_PH, rootPath);
                const localHeader = header.replaceAll(ROOT_PH, rootPath);
                const localFooter = footer.replaceAll(ROOT_PH, rootPath);
                
                let content = readFileSync(currentSrcPath, 'utf8');

                content = content.replace('<!-- BUILD-PLACEHOLDER:IMPORTMAP -->', localImportmap);
                content = content.replace('<!-- BUILD-PLACEHOLDER:NS-IMPORT -->', localNsImport);
                content = content.replace('<!-- BUILD-PLACEHOLDER:HEADER -->', localHeader);
                content = content.replace('<!-- BUILD-PLACEHOLDER:FOOTER -->', localFooter);
                
                content = content.replaceAll(ROOT_PH, rootPath);

                writeFileSync(distPath, content, 'utf8');
                console.log(`HTML Build: ${relative(__dirname, distPath)} (Root: ${rootPath})`);
            } else {
                copyFileSync(currentSrcPath, distPath);
            }
        }
    });
}

buildDirectory(srcDir, distDir);


// Root folder files
const root_files = [
    'third-party-notice.md',
    'favicon.ico',
    'lib',
]
root_files.forEach((name)=>{
    const filePath = join(__dirname, name);
    const filePathDist = join(distDir, name)
    cpSync(filePath, filePathDist, { recursive: true })
    console.log(`Root file copy: dist/${name}`);
})