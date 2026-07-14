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

    // Create User documents for coordinators if password is provided and email doesn't exist
    if (coordinators && coordinators.length > 0) {
      for (const coord of coordinators) {
        console.log('[CREATE CLUB] Checking coordinator:', coord.email, 'has password:', !!coord.password);
          const existingUser = await User.findOne({ email: coord.email.toLowerCase().trim() });
          console.log('[CREATE CLUB] Existing user check:', coord.email, 'found:', !!existingUser);
          if (!existingUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(coord.password, salt);
            const newUser = await User.create({
              email: coord.email.toLowerCase().trim(),
              password: hashedPassword,
              plain_password: coord.password,
              full_name: coord.name,
              role: 'coordinator',
              phone: coord.phone || ''
            });
            console.log('[CREATE CLUB] Created User account:', newUser._id);
          } else {
            existingUser.role = 'coordinator';
            existingUser.full_name = coord.name || existingUser.full_name;
            existingUser.phone = coord.phone || existingUser.phone || '';
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
        console.log('[EDIT CLUB] Checking coordinator:', coord.email, 'has password:', !!coord.password);
        if (coord.email) {
          const existingUser = await User.findOne({ email: coord.email.toLowerCase().trim() });
          console.log('[EDIT CLUB] Existing user check:', coord.email, 'found:', !!existingUser);
          if (!existingUser) {
            if (coord.password) {
              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash(coord.password, salt);
              const newUser = await User.create({
                email: coord.email.toLowerCase().trim(),
                password: hashedPassword,
                plain_password: coord.password,
                full_name: coord.name,
                role: 'coordinator',
                phone: coord.phone || ''
              });
              console.log('[EDIT CLUB] Created User account:', newUser._id);
            }
          } else {
            // Update existing user properties and set role to coordinator
            existingUser.role = 'coordinator';
            existingUser.full_name = coord.name || existingUser.full_name;
            existingUser.phone = coord.phone !== undefined ? coord.phone : existingUser.phone;
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
