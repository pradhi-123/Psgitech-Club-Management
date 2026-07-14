import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('1 Yr 06-22 FN.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Total Rows:', jsonData.length);
console.log('Headers:', jsonData[0]);
console.log('First 5 rows preview:');
for (let i = 1; i < Math.min(jsonData.length, 6); i++) {
  console.log(`Row ${i}:`, jsonData[i]);
}
