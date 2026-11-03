import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const builtHtml = path.join(docsDir, 'app.html');
const indexHtml = path.join(docsDir, 'index.html');

if (!existsSync(docsDir)) {
  throw new Error('پوشه docs ساخته نشد؛ اول vite build را اجرا کنید.');
}

if (existsSync(builtHtml)) {
  rmSync(indexHtml, { force: true });
  renameSync(builtHtml, indexHtml);
}

// Jekyll نباید فایلهای ساختهشده داخل docs/ را دستکاری کند.
writeFileSync(path.join(root, '.nojekyll'), '');
writeFileSync(path.join(docsDir, '.nojekyll'), '');

console.log('docs/index.html و .nojekyll آماده شدند.');
