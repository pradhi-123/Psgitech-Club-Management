import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, StudentCredits, Club } from '../models.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'psgitech_secret_key_12345';

// JWT Authentication Middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // email holds the username/email/roll number input

  try {
    const inputStr = email ? email.trim() : '';
    let user;

    if (inputStr.toLowerCase() === 'admin' || inputStr.toLowerCase() === 'psgitech@123') {
      user = await User.findOne({ email: 'admin@psgitech.edu' });
    } else {
      user = await User.findOne({
        $or: [
          { email: inputStr.toLowerCase() },
          { roll_number: inputStr.toUpperCase() }
        ]
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      profile: {
        id: user._id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        roll_number: user.roll_number,
        department: user.department,
        section: user.section,
        year: user.year
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      roll_number: user.roll_number,
      department: user.department,
      section: user.section,
      year: user.year
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only route middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access forbidden: Administrators only' });
  }
  next();
};

// GET /api/users/coordinators (fetch all coordinators)
router.get('/users/coordinators', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coordinators = await User.find({ role: 'coordinator' }).select('-password');
    res.json(coordinators.map(c => ({
      id: c._id,
      full_name: c.full_name,
      email: c.email,
      role: c.role
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/students (fetch all students)
router.get('/users/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students.map(s => ({
      id: s._id,
      full_name: s.full_name,
      email: s.email,
      role: s.role,
      roll_number: s.roll_number,
      department: s.department,
      section: s.section,
      year: s.year
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users (Create a new user - Admin functionality replacing 'create-user' Edge Function)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  const { email, password, full_name, role, roll_number, department, section, year, club_id } = req.body;

  try {
    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (roll_number) {
      const existingRoll = await User.findOne({ roll_number: roll_number.trim() });
      if (existingRoll) {
        return res.status(400).json({ message: 'User with this roll number already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      full_name,
      role,
      roll_number: roll_number ? roll_number.trim() : undefined,
      department,
      section,
      year
    });

    // If student, initialize credits record (PostgreSQL trigger replacement)
    if (role === 'student') {
      await StudentCredits.create({
        student_id: newUser._id,
        total_points: 0,
        events_attended: 0,
        badges_earned: 0
      });
    }

    // If coordinator and club_id is provided, automatically add them to the club's coordinators list
    if (role === 'coordinator' && club_id) {
      const club = await Club.findById(club_id);
      if (club) {
        const exists = club.coordinators?.some(c => c.email?.toLowerCase() === email.toLowerCase().trim());
        if (!exists) {
          club.coordinators = club.coordinators || [];
          club.coordinators.push({
            name: full_name,
            email: email.toLowerCase().trim()
          });
          await club.save();
        }
      }
    }

    res.status(201).json({ message: 'User created successfully', id: newUser._id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// PUT /api/users/:id (Update user - Admin functionality)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { full_name, email, roll_number, department, section, year } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.full_name = full_name || user.full_name;
    user.email = email ? email.toLowerCase().trim() : user.email;
    user.roll_number = roll_number ? roll_number.trim() : user.roll_number;
    user.department = department || user.department;
    user.section = section || user.section;
    user.year = year !== undefined ? year : user.year;

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// DELETE /api/users/:id (Delete user - Admin functionality)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clean up credits if student
    if (user.role === 'student') {
      await StudentCredits.deleteOne({ student_id: user._id });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
