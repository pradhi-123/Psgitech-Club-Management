import mongoose from 'mongoose';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve('.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in .env');
  process.exit(1);
}

// User Schema (matching models.js)
const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'coordinator', 'student'], required: true },
  full_name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  plain_password: { type: String },
  roll_number: { type: String, unique: true, sparse: true },
  department: String,
  section: String,
  year: Number,
  phone: String,
  created_at: { type: Date, default: Date.now }
});

const StudentCreditsSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  total_points: { type: Number, default: 0 },
  events_attended: { type: Number, default: 0 },
  badges_earned: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const StudentCredits = mongoose.model('StudentCredits', StudentCreditsSchema);

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Successfully connected to MongoDB!');

  const filePath = path.resolve('../1 Yr 06-22 FN.xlsx');
  console.log(`Reading Excel file: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  let importCount = 0;
  let skipCount = 0;

  console.log(`Starting import of ${jsonData.length - 1} records...`);

  // Skip header row
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 2) continue;

    const rawRoll = String(row[0] || '').trim();
    const rawName = String(row[1] || '').trim();

    if (!rawRoll || !rawName) {
      skipCount++;
      continue;
    }

    const roll_number = rawRoll.toUpperCase();
    const email = `${roll_number.toLowerCase()}@psgitech.ac.in`;

    // Check if student already exists
    const existing = await User.findOne({
      $or: [
        { roll_number: roll_number },
        { email: email }
      ]
    });

    if (existing) {
      console.log(`Row ${i}: Student ${rawName} (${roll_number}) already exists. Skipping.`);
      skipCount++;
      continue;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(roll_number, salt);

    // Create student user
    const newUser = await User.create({
      email: email,
      password: hashedPassword,
      plain_password: roll_number,
      full_name: rawName,
      role: 'student',
      roll_number: roll_number,
      year: 1, // 1st year students
      department: '1st Year' // Default dept since it's a general list
    });

    // Create credits record
    await StudentCredits.create({
      student_id: newUser._id,
      total_points: 0,
      events_attended: 0,
      badges_earned: 0
    });

    console.log(`Row ${i}: Successfully imported ${rawName} (${roll_number})`);
    importCount++;
  }

  console.log(`\nImport complete!`);
  console.log(`Successfully imported: ${importCount} students`);
  console.log(`Skipped/Existing: ${skipCount} records`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
