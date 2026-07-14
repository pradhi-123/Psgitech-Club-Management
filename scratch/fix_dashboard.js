import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace 1:
content = content.replace(
  /u\.roll_number\?\.toUpperCase\(\)\.trim\(\) === inputRoll\.trim\(\)/g,
  "String(u.roll_number || '').toUpperCase().trim() === inputRoll.trim()"
);

// Replace 2:
content = content.replace(
  /s\.roll_number\?\.toUpperCase\(\)\.trim\(\) === inputRoll\.trim\(\)/g,
  "String(s.roll_number || '').toUpperCase().trim() === inputRoll.trim()"
);

// Replace 3:
content = content.replace(
  /s\.roll_number\?\.toUpperCase\(\)\.includes\(/g,
  "String(s.roll_number || '').toUpperCase().includes("
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.tsx successfully patched!');
