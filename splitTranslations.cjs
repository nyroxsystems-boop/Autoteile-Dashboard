const fs = require('fs');
const path = require('path');

const tsCode = fs.readFileSync(path.join(__dirname, 'src/translations.ts'), 'utf8');

let jsCode = tsCode
    .replace(/type\s+Lang\s*=[^;]+;/g, '')
    .replace(/type\s+Dict\s*=[^;]+;/g, '')
    .replace(/const\s+(\w+):\s*Dict\s*=/g, 'var $1 =')
    .replace(/function\s+makeLang\([^)]+\)[^{]+{/g, 'function makeLang(overrides) {')
    .replace(/export\s+const\s+translations[^{]+{/g, 'var translations = {')
    .replace(/return\s+\{[^}]+\}\s+as\s+Dict;/g, 'return { ...en, ...overrides };');

// Evaluate the JS code
eval(jsCode);

const localesDir = path.join(__dirname, 'src', 'locales');
if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
}

for (const [lang, dict] of Object.entries(translations)) {
    const filePath = path.join(localesDir, `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
    console.log(`Wrote ${filePath}`);
}
