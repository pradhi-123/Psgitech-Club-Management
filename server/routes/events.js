import express from 'express';
import { Event, Club, User, EventRegistration, AttendanceScan, StudentCredits, Badge } from '../models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper: check if coordinator or admin
const requireStaff = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Forbidden: Staff access required' });
  }
  next();
};

// GET /api/events (Fetch events - matches student/admin views)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('club_id')
      .populate('coordinator_id', 'full_name')
      .sort({ event_date: 1 });

    const eventsWithStats = await Promise.all(events.map(async e => {
      const registeredCount = await EventRegistration.countDocuments({ event_id: e._id });
      const attendedCount = await EventRegistration.countDocuments({ event_id: e._id, attendance_confirmed: true });
      return {
        id: e._id,
        name: e.name,
        category: e.category,
        description: e.description,
        event_date: e.event_date.toISOString(),
        duration: e.duration,
        max_participants: e.max_participants,
        credit_points: e.credit_points,
        bonus_points: e.bonus_points,
        volunteer_points: e.volunteer_points || 3,
        volunteers: e.volunteers,
        club_id: e.club_id?._id,
        coordinator_id: e.coordinator_id?._id,
        created_at: e.created_at,
        clubs: e.club_id ? { name: e.club_id.name, coordinators: e.club_id.coordinators || [] } : null,
        profiles: e.coordinator_id ? { full_name: e.coordinator_id.full_name } : null,
        registered_count: registeredCount,
        attended_count: attendedCount
      };
    }));

    res.json(eventsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching events: ' + error.message });
  }
});

// GET /api/events/coordinator (Fetch coordinator's events)
router.get('/coordinator', authenticateToken, requireStaff, async (req, res) => {
  try {
    const events = await Event.find({ coordinator_id: req.user.id })
      .populate('club_id')
      .sort({ event_date: -1 });

    res.json(events.map(e => ({
      id: e._id,
      name: e.name,
      category: e.category,
      description: e.description,
      event_date: e.event_date.toISOString(),
      duration: e.duration,
      max_participants: e.max_participants,
      credit_points: e.credit_points,
      bonus_points: e.bonus_points,
      volunteer_points: e.volunteer_points || 3, // mapped
      volunteers: e.volunteers,
      club_id: e.club_id?._id,
      coordinator_id: e.coordinator_id,
      created_at: e.created_at,
      clubs: e.club_id ? { name: e.club_id.name, coordinators: e.club_id.coordinators || [] } : null
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching coordinator events' });
  }
});

// POST /api/events (Create event - Coordinator or Admin)
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  const { name, description, club_id, category, event_date, duration, max_participants, credit_points, bonus_points, volunteers, volunteer_points } = req.body;

  if (!name || !club_id || !event_date) {
    return res.status(400).json({ message: 'Missing required event fields' });
  }

  try {
    const newEvent = await Event.create({
      club_id,
      coordinator_id: req.user.id,
      name,
      category,
      description,
      event_date: new Date(event_date),
      duration,
      max_participants: max_participants || null,
      credit_points: credit_points !== undefined ? credit_points : 2,
      bonus_points: bonus_points !== undefined ? bonus_points : 0,
      volunteer_points: volunteer_points !== undefined ? volunteer_points : 3,
      volunteers: volunteers || ''
    });

    res.status(201).json({ message: 'Event created successfully', id: newEvent._id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating event' });
  }
});

// PUT /api/events/edit/:eventId (Edit event details - Coordinator or Admin)
router.put('/edit/:eventId', authenticateToken, requireStaff, async (req, res) => {
  const { name, description, category, event_date, duration, max_participants, credit_points, bonus_points, volunteers, volunteer_points } = req.body;

  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Ensure coordinator owns this event (or user is admin)
    if (req.user.role !== 'admin' && event.coordinator_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this event' });
    }

    event.name = name || event.name;
    event.description = description !== undefined ? description : event.description;
    event.category = category || event.category;
    event.event_date = event_date ? new Date(event_date) : event.event_date;
    event.duration = duration !== undefined ? duration : event.duration;
    event.max_participants = max_participants !== undefined ? max_participants : event.max_participants;
    event.credit_points = credit_points !== undefined ? credit_points : event.credit_points;
    event.bonus_points = bonus_points !== undefined ? bonus_points : event.bonus_points;
    event.volunteer_points = volunteer_points !== undefined ? volunteer_points : event.volunteer_points;
    event.volunteers = volunteers !== undefined ? volunteers : event.volunteers;
    event.updated_at = new Date();

    await event.save();
    res.json({ message: 'Event updated successfully', id: event._id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating event' });
  }
});

// POST /api/events/volunteers/confirm (Confirm volunteer attendance & award points)
router.post('/volunteers/confirm', authenticateToken, requireStaff, async (req, res) => {
  const { eventId, rollNumber } = req.body;

  if (!eventId || !rollNumber) {
    return res.status(400).json({ message: 'Event ID and Student Roll Number are required' });
  }

  try {
    const student = await User.findOne({ roll_number: { $regex: new RegExp('^' + rollNumber.trim() + '$', 'i') } });
    if (!student) {
      return res.status(404).json({ message: `Student with roll number ${rollNumber} not found` });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Look for existing registration or create one
    let reg = await EventRegistration.findOne({ event_id: eventId, student_id: student._id });
    
    if (reg && reg.attendance_confirmed && reg.is_volunteer) {
      return res.status(400).json({ message: 'Volunteer attendance already confirmed for this student.' });
    }

    const now = new Date();
    const volunteerCredits = event.volunteer_points || 3;

    if (!reg) {
      reg = new EventRegistration({
        event_id: eventId,
        student_id: student._id,
        qr_code: `VOLUNTEER-${student._id}-${eventId}-${Date.now()}`,
        is_volunteer: true,
        attendance_confirmed: true,
        points_awarded: volunteerCredits,
        entry_scanned_at: now,
        exit_scanned_at: now
      });
    } else {
      reg.is_volunteer = true;
      reg.attendance_confirmed = true;
      reg.points_awarded = volunteerCredits;
      reg.entry_scanned_at = reg.entry_scanned_at || now;
      reg.exit_scanned_at = reg.exit_scanned_at || now;
    }

    await reg.save();

    // Award Credits & check Badges (Mongoose Trigger logic)
    let credits = await StudentCredits.findOne({ student_id: student._id });
    if (!credits) {
      credits = await StudentCredits.create({
        student_id: student._id,
        total_points: 0,
        events_attended: 0,
        badges_earned: 0
      });
    }

    credits.total_points += volunteerCredits;
    credits.events_attended += 1;
    credits.updated_at = now;

    const newBadgeLevel = Math.floor(credits.total_points / 5);
    if (newBadgeLevel > 0) {
      const badgeExists = await Badge.findOne({ student_id: student._id, badge_level: newBadgeLevel });
      if (!badgeExists) {
        await Badge.create({
          student_id: student._id,
          badge_level: newBadgeLevel,
          badge_name: `Level ${newBadgeLevel} Achiever`
        });
      }
    }

    const totalBadges = await Badge.countDocuments({ student_id: student._id });
    credits.badges_earned = totalBadges;
    await credits.save();

    res.json({ message: `Volunteer attendance confirmed for ${student.full_name}! Awarded ${volunteerCredits} points.` });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error confirming volunteer' });
  }
});

// GET /api/events/registrations/:eventId (Get registrations for event - Coordinator or Admin)
router.get('/registrations/:eventId', authenticateToken, requireStaff, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ event_id: req.params.eventId })
      .populate('student_id')
      .sort({ registered_at: -1 });

    res.json(regs.map(r => ({
      id: r._id,
      event_id: r.event_id,
      student_id: r.student_id?._id,
      qr_code: r.qr_code,
      entry_scanned_at: r.entry_scanned_at ? r.entry_scanned_at.toISOString() : null,
      exit_scanned_at: r.exit_scanned_at ? r.exit_scanned_at.toISOString() : null,
      attendance_confirmed: r.attendance_confirmed,
      points_awarded: r.points_awarded,
      is_volunteer: r.is_volunteer,
      certificate_generated: r.certificate_generated,
      registered_at: r.registered_at,
      profiles: r.student_id ? {
        full_name: r.student_id.full_name,
        email: r.student_id.email,
        roll_number: r.student_id.roll_number,
        department: r.student_id.department,
        year: r.student_id.year,
        section: r.student_id.section
      } : null
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching registrations' });
  }
});

// POST /api/events/volunteers/names (Fetch student names by roll numbers - Coordinator or Admin)
router.post('/volunteers/names', authenticateToken, requireStaff, async (req, res) => {
  const { rollNumbers } = req.body;
  if (!rollNumbers || !Array.isArray(rollNumbers)) {
    return res.status(400).json({ message: 'rollNumbers array is required' });
  }

  try {
    const formattedRolls = rollNumbers.map(r => r.trim());
    const users = await User.find({ 
      role: 'student', 
      roll_number: { $in: formattedRolls } 
    }).select('roll_number full_name');

    const nameMap = {};
    users.forEach(u => {
      nameMap[u.roll_number] = u.full_name;
    });

    res.json({ nameMap });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching volunteer names' });
  }
});

// POST /api/events/register (Register student for event)
router.post('/register', authenticateToken, async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) return res.status(400).json({ message: 'Event ID is required' });

  try {
    // Check if already registered
    const existing = await EventRegistration.findOne({ event_id: eventId, student_id: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const qrCode = `${req.user.id}-${eventId}-${Date.now()}`;
    const newReg = await EventRegistration.create({
      event_id: eventId,
      student_id: req.user.id,
      qr_code: qrCode
    });

    res.status(201).json({ message: 'Registered successfully', id: newReg._id, qr_code: qrCode });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error registering for event' });
  }
});

// GET /api/events/my-registrations (Student fetches registrations)
router.get('/my-registrations', authenticateToken, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ student_id: req.user.id })
      .populate({
        path: 'event_id',
        populate: { path: 'club_id' }
      });

    res.json(regs.map(r => ({
      id: r._id,
      event_id: r.event_id?._id,
      student_id: r.student_id,
      qr_code: r.qr_code,
      entry_scanned_at: r.entry_scanned_at,
      exit_scanned_at: r.exit_scanned_at,
      attendance_confirmed: r.attendance_confirmed,
      points_awarded: r.points_awarded,
      is_volunteer: r.is_volunteer,
      certificate_generated: r.certificate_generated,
      registered_at: r.registered_at,
      events: r.event_id ? {
        id: r.event_id._id,
        name: r.event_id.name,
        event_date: r.event_id.event_date.toISOString(),
        clubs: r.event_id.club_id ? { name: r.event_id.club_id.name } : null
      } : null
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching registrations' });
  }
});

// GET /api/students/credits (Get student credits summary)
router.get('/students/credits', authenticateToken, async (req, res) => {
  try {
    let credits = await StudentCredits.findOne({ student_id: req.user.id });
    if (!credits) {
      credits = await StudentCredits.create({
        student_id: req.user.id,
        total_points: 0,
        events_attended: 0,
        badges_earned: 0
      });
    }
    res.json({
      total_points: credits.total_points,
      events_attended: credits.events_attended,
      badges_earned: credits.badges_earned
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching credits' });
  }
});

// POST /api/events/scan (Mark QR code scan & award points - Coordinator/Admin)
router.post('/scan', authenticateToken, requireStaff, async (req, res) => {
  const { eventId, qrCode, scanType } = req.body;

  try {
    const reg = await EventRegistration.findOne({ event_id: eventId, qr_code: qrCode }).populate('student_id');
    if (!reg) return res.status(404).json({ message: 'Invalid QR code for this event' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (reg.entry_scanned_at && reg.exit_scanned_at) {
      return res.status(400).json({ message: 'Both entry and exit scans already completed.' });
    }

    if (scanType === 'entry' && reg.entry_scanned_at) {
      return res.status(400).json({ message: 'Entry already scanned for this student' });
    }

    if (scanType === 'exit' && !reg.entry_scanned_at) {
      return res.status(400).json({ message: 'Please scan entry first before exit' });
    }

    if (scanType === 'exit' && reg.exit_scanned_at) {
      return res.status(400).json({ message: 'Exit already scanned for this student' });
    }

    const now = new Date();
    if (scanType === 'entry') {
      reg.entry_scanned_at = now;
    } else {
      reg.exit_scanned_at = now;
      reg.attendance_confirmed = true;
      reg.points_awarded = (event.credit_points || 2) + (event.bonus_points || 0);

      // --- Credits and Badges Trigger Logic ---
      let credits = await StudentCredits.findOne({ student_id: reg.student_id._id });
      if (!credits) {
        credits = await StudentCredits.create({
          student_id: reg.student_id._id,
          total_points: 0,
          events_attended: 0,
          badges_earned: 0
        });
      }

      credits.total_points += reg.points_awarded;
      credits.events_attended += 1;
      credits.updated_at = now;

      // Check badge awards (every 5 points)
      const newBadgeLevel = Math.floor(credits.total_points / 5);
      if (newBadgeLevel > 0) {
        const badgeExists = await Badge.findOne({ student_id: reg.student_id._id, badge_level: newBadgeLevel });
        if (!badgeExists) {
          await Badge.create({
            student_id: reg.student_id._id,
            badge_level: newBadgeLevel,
            badge_name: `Level ${newBadgeLevel} Achiever`
          });
        }
      }

      // Sync total badges count
      const totalBadges = await Badge.countDocuments({ student_id: reg.student_id._id });
      credits.badges_earned = totalBadges;
      await credits.save();
    }

    await reg.save();

    // Create scan log
    await AttendanceScan.create({
      registration_id: reg._id,
      scan_type: scanType,
      scanned_by: req.user.id
    });

    res.json({
      message: `${scanType === 'entry' ? 'Entry' : 'Exit'} scan recorded successfully!`,
      attendance_confirmed: reg.attendance_confirmed
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error scanning QR' });
  }
});

// POST /api/certificates/generate (Generate certificate metadata - replaces generate-certificate Edge Function)
router.post('/certificates/generate', authenticateToken, async (req, res) => {
  const { registrationId } = req.body;

  try {
    const reg = await EventRegistration.findById(registrationId)
      .populate('student_id')
      .populate({
        path: 'event_id',
        populate: { path: 'club_id' }
      });

    if (!reg) return res.status(404).json({ message: 'Registration record not found' });
    if (!reg.attendance_confirmed) {
      return res.status(400).json({ message: 'Attendance must be confirmed before certificate generation' });
    }

    // Mark certificate generated
    reg.certificate_generated = true;
    await reg.save();

    // Format output exactly as frontend jsPDF generator expects
    const certData = {
      studentName: reg.student_id.full_name,
      rollNumber: reg.student_id.roll_number,
      department: reg.student_id.department || 'N/A',
      year: reg.student_id.year || 1,
      section: reg.student_id.section || 'A',
      eventName: reg.event_id.name,
      clubName: reg.event_id.club_id?.name || 'College Club',
      creditPoints: reg.points_awarded || 2,
      certificateType: reg.is_volunteer ? 'volunteer' : 'participation', // set type
      certificateId: `${reg.is_volunteer ? 'VOL' : 'CERT'}-${reg._id.toString().substring(18).toUpperCase()}`,
      issuedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      coordinators: reg.event_id.club_id?.coordinators?.map(c => c.name).join(', ') || 'Club Coordinator'
    };

    res.json({ certificate: certData });
  } catch (error) {
    res.status(500).json({ message: 'Server error generating certificate data' });
  }
});

// DELETE /api/events/:eventId (Delete event and registrations - Coordinator or Admin only)
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: only admin or the event's coordinator can delete
    if (req.user.role !== 'admin' && event.coordinator_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this event' });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    // Also delete associated registrations
    await EventRegistration.deleteMany({ event_id: req.params.eventId });

    res.json({ message: 'Event and registrations deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error deleting event' });
  }
});

export default router;
