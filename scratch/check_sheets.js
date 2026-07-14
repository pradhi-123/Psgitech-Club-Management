import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('1 Yr 06-22 FN.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);
for (const sheetName of workbook.SheetNames) {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`Sheet: "${sheetName}", Total Rows: ${jsonData.length}`);
  if (jsonData.length > 0) {
    console.log(`Headers for "${sheetName}":`, jsonData[0]);
    console.log(`First row:`, jsonData[1]);
  }
  console.log('---');
}
