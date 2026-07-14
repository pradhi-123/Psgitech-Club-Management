import mongoose from 'mongoose';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
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

function parseSheetInfo(sheetName) {
  // e.g. "AI&DS-A-25HS201" -> ['AI&DS', 'A', '25HS201']
  // e.g. "EE-VLSI-1" -> ['EE', 'VLSI', '1']
  const parts = sheetName.split('-').map(p => p.trim().toUpperCase());
  let dept = 'GENERAL';
  let sec = 'A';

  if (sheetName.includes('AI&DS') || sheetName.includes('AIDS')) {
    dept = 'AIDS';
  } else if (sheetName.includes('CSE')) {
    dept = 'CSE';
  } else if (sheetName.includes('ECE')) {
    dept = 'ECE';
  } else if (sheetName.includes('EEE')) {
    dept = 'EEE';
  } else if (sheetName.includes('CIVIL')) {
    dept = 'CIVIL';
  } else if (sheetName.includes('MECHANICAL') || sheetName.includes('MECH')) {
    dept = 'MECH';
  } else if (sheetName.includes('I&CE') || sheetName.includes('ICE')) {
    dept = 'ICE';
  } else if (sheetName.includes('VLSI')) {
    dept = 'VLSI';
  }

  // Extract section
  // Typically the second part, but if EE-VLSI-1, it might be the third part
  if (parts.length >= 2) {
    const candidateSec = parts[1];
    if (['A', 'B', 'C', 'D', 'E', '1', '2'].includes(candidateSec)) {
      sec = candidateSec;
    } else if (parts.length >= 3) {
      const candidateSec3 = parts[2];
      if (['A', 'B', 'C', 'D', 'E', '1', '2'].includes(candidateSec3)) {
        sec = candidateSec3;
      }
    }
  }

  return { department: dept, section: sec };
}

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Successfully connected to MongoDB!');

  const filePath = path.resolve('../1 Yr 06-22 FN.xlsx');
  console.log(`Reading Excel file: ${filePath}`);
  const workbook = XLSX.readFile(filePath);

  let totalImported = 0;
  let totalSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const { department, section } = parseSheetInfo(sheetName);
    console.log(`\nProcessing Sheet: "${sheetName}" -> Dept: ${department}, Sec: ${section}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let sheetImported = 0;
    let sheetSkipped = 0;

    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 2) continue;

      const rawRoll = String(row[0] || '').trim();
      const rawName = String(row[1] || '').trim();

      if (!rawRoll || !rawName) {
        sheetSkipped++;
        continue;
      }

      const roll_number = rawRoll.toUpperCase();
      const email = `${roll_number.toLowerCase()}@psgitech.ac.in`;

      // Check if student already exists
      let studentUser = await User.findOne({
        $or: [
          { roll_number: roll_number },
          { email: email }
        ]
      });

      if (studentUser) {
        // If they already exist, update their department and section if it was wrong
        if (studentUser.department !== department || studentUser.section !== section) {
          studentUser.department = department;
          studentUser.section = section;
          await studentUser.save();
          console.log(`Updated existing student ${rawName} (${roll_number}) to Dept: ${department}, Sec: ${section}`);
        }
        sheetSkipped++;
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
        department: department,
        section: section
      });

      // Create credits record
      await StudentCredits.create({
        student_id: newUser._id,
        total_points: 0,
        events_attended: 0,
        badges_earned: 0
      });

      sheetImported++;
    }

    console.log(`Sheet "${sheetName}": Imported: ${sheetImported}, Skipped/Updated: ${sheetSkipped}`);
    totalImported += sheetImported;
    totalSkipped += sheetSkipped;
  }

  console.log(`\nMigration complete!`);
  console.log(`Total students imported: ${totalImported}`);
  console.log(`Total students skipped/updated: ${totalSkipped}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
