import mongoose from 'mongoose';

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

// Added coordinators nested schema to support multi-coordinator clubs with emails
const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  logo_url: String,
  coordinators: [{
    name: String,
    phone: String,
    email: String,
    roll_number: String
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const ClubCoordinatorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  signature_url: String,
  signature_name: String,
  created_at: { type: Date, default: Date.now }
});
ClubCoordinatorSchema.index({ user_id: 1, club_id: 1 }, { unique: true });

const EventSchema = new mongoose.Schema({
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  coordinator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  event_date: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  max_participants: Number,
  credit_points: { type: Number, default: 2 },
  bonus_points: { type: Number, default: 0 },
  volunteer_points: { type: Number, default: 3 }, // Added volunteer points
  volunteers: String, // comma-separated roll numbers
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const EventRegistrationSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qr_code: { type: String, required: true, unique: true },
  entry_scanned_at: Date,
  exit_scanned_at: Date,
  attendance_confirmed: { type: Boolean, default: false },
  points_awarded: { type: Number, default: 0 },
  is_volunteer: { type: Boolean, default: false }, // Added volunteer flag
  certificate_generated: { type: Boolean, default: false },
  registered_at: { type: Date, default: Date.now }
});
EventRegistrationSchema.index({ event_id: 1, student_id: 1 }, { unique: true });

const AttendanceScanSchema = new mongoose.Schema({
  registration_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRegistration', required: true },
  scan_type: { type: String, enum: ['entry', 'exit'], required: true },
  scanned_at: { type: Date, default: Date.now },
  scanned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const StudentCreditsSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  total_points: { type: Number, default: 0 },
  events_attended: { type: Number, default: 0 },
  badges_earned: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

const BadgeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badge_level: { type: Number, required: true },
  badge_name: { type: String, required: true },
  earned_at: { type: Date, default: Date.now }
});

const AnnouncementSchema = new mongoose.Schema({
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Club = mongoose.model('Club', ClubSchema);
export const ClubCoordinator = mongoose.model('ClubCoordinator', ClubCoordinatorSchema);
export const Event = mongoose.model('Event', EventSchema);
export const EventRegistration = mongoose.model('EventRegistration', EventRegistrationSchema);
export const AttendanceScan = mongoose.model('AttendanceScan', AttendanceScanSchema);
export const StudentCredits = mongoose.model('StudentCredits', StudentCreditsSchema);
export const Badge = mongoose.model('Badge', BadgeSchema);
export const Announcement = mongoose.model('Announcement', AnnouncementSchema);
