import express from 'express';
import bcrypt from 'bcryptjs';
import { Club, User } from '../models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware to ensure Admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin role required' });
  }
  next();
};

// GET /api/clubs (Fetch all clubs)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    // Map to frontend expected shape
    res.json(clubs.map(c => ({
      id: c._id,
      name: c.name,
      description: c.description,
      logo_url: c.logo_url,
      coordinators: c.coordinators || []
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching clubs' });
  }
});

// POST /api/clubs (Create club - Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, coordinators } = req.body;
  console.log('[CREATE CLUB] Received coordinators:', JSON.stringify(coordinators, null, 2));

  if (!name) {
    return res.status(400).json({ message: 'Club name is required' });
  }

  try {
    const newClub = await Club.create({
      name,
      description,
      coordinators: coordinators || []
    });

    // Create User documents for coordinators if password is provided
    if (coordinators && coordinators.length > 0) {
      for (const coord of coordinators) {
        console.log('[CREATE CLUB] Checking coordinator:', coord.email);
        
        let existingUser = null;
        if (coord.roll_number) {
          existingUser = await User.findOne({ roll_number: coord.roll_number.toUpperCase().trim() });
        }
        if (!existingUser && coord.email && coord.email !== 'Unavailable' && coord.email.trim() !== '') {
          existingUser = await User.findOne({ email: coord.email.toLowerCase().trim() });
        }

        let targetEmail = coord.email;
        if (!targetEmail || targetEmail === 'Unavailable' || targetEmail.trim() === '') {
          if (coord.roll_number) {
            targetEmail = `${coord.roll_number.toLowerCase()}@psgitech.ac.in`;
          } else {
            targetEmail = `placeholder-${Math.random().toString(36).substring(2, 9)}@placeholder.com`;
          }
        }

        if (!existingUser) {
          const defaultPassword = coord.password || coord.roll_number || 'psgitech123';
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);
          const newUser = await User.create({
            email: targetEmail.toLowerCase().trim(),
            password: hashedPassword,
            plain_password: defaultPassword,
            full_name: coord.name,
            role: 'coordinator',
            phone: coord.phone || 'Unavailable',
            roll_number: coord.roll_number ? coord.roll_number.toUpperCase().trim() : undefined
          });
          console.log('[CREATE CLUB] Created User account:', newUser._id);
        } else {
          existingUser.role = 'coordinator';
          existingUser.full_name = coord.name || existingUser.full_name;
          existingUser.phone = coord.phone || existingUser.phone || 'Unavailable';
          if (coord.roll_number) {
            existingUser.roll_number = coord.roll_number.toUpperCase().trim();
          }
          if (coord.password && coord.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(coord.password, salt);
            existingUser.plain_password = coord.password;
          }
          await existingUser.save();
          console.log('[CREATE CLUB] Updated existing User to coordinator:', existingUser._id);
        }
      }
    }

    res.status(201).json({
      message: 'Club created successfully',
      id: newClub._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating club' });
  }
});

// PUT /api/clubs/edit/:clubId (Edit club - Admin only)
router.put('/edit/:clubId', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, coordinators } = req.body;
  console.log('[EDIT CLUB] Received coordinators:', JSON.stringify(coordinators, null, 2));

  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    club.name = name || club.name;
    club.description = description !== undefined ? description : club.description;
    club.coordinators = coordinators !== undefined ? coordinators : club.coordinators;
    club.updated_at = new Date();

    await club.save();

    // Create User documents for any new coordinators if password is provided
    if (coordinators && coordinators.length > 0) {
      for (const coord of coordinators) {
        console.log('[EDIT CLUB] Checking coordinator:', coord.email);
        
        let existingUser = null;
        if (coord.roll_number) {
          existingUser = await User.findOne({ roll_number: coord.roll_number.toUpperCase().trim() });
        }
        if (!existingUser && coord.email && coord.email !== 'Unavailable' && coord.email.trim() !== '') {
          existingUser = await User.findOne({ email: coord.email.toLowerCase().trim() });
        }

        let targetEmail = coord.email;
        if (!targetEmail || targetEmail === 'Unavailable' || targetEmail.trim() === '') {
          if (coord.roll_number) {
            targetEmail = `${coord.roll_number.toLowerCase()}@psgitech.ac.in`;
          } else {
            targetEmail = `placeholder-${Math.random().toString(36).substring(2, 9)}@placeholder.com`;
          }
        }

        if (!existingUser) {
          const defaultPassword = coord.password || coord.roll_number || 'psgitech123';
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);
          const newUser = await User.create({
            email: targetEmail.toLowerCase().trim(),
            password: hashedPassword,
            plain_password: defaultPassword,
            full_name: coord.name,
            role: 'coordinator',
            phone: coord.phone || 'Unavailable',
            roll_number: coord.roll_number ? coord.roll_number.toUpperCase().trim() : undefined
          });
          console.log('[EDIT CLUB] Created User account:', newUser._id);
        } else {
          // Update existing user properties and set role to coordinator
          existingUser.role = 'coordinator';
          existingUser.full_name = coord.name || existingUser.full_name;
          existingUser.phone = coord.phone || existingUser.phone || 'Unavailable';
          if (coord.roll_number) {
            existingUser.roll_number = coord.roll_number.toUpperCase().trim();
          }
          if (coord.password && coord.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(coord.password, salt);
            existingUser.plain_password = coord.password;
          }
          await existingUser.save();
          console.log('[EDIT CLUB] Updated existing User account to coordinator:', existingUser._id);
        }
      }
    }

    res.json({ message: 'Club updated successfully', id: club._id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating club' });
  }
});

// DELETE /api/clubs/:clubId (Delete club - Admin only)
router.delete('/:clubId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error deleting club' });
  }
});

export default router;
