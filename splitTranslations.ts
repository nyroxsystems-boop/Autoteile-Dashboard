import fs from 'fs';
import path from 'path';
import { translations } from './src/translations';

const localesDir = path.join(__dirname, 'src', 'locales');

if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
}

for (const [lang, dict] of Object.entries(translations)) {
    const filePath = path.join(localesDir, `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
    console.log(`Wrote ${filePath}`);
}
