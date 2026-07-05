import express from 'express';
import { Club } from '../models.js';
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

  if (!name) {
    return res.status(400).json({ message: 'Club name is required' });
  }

  try {
    const newClub = await Club.create({
      name,
      description,
      coordinators: coordinators || []
    });

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
    res.json({ message: 'Club updated successfully', id: club._id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating club' });
  }
});

export default router;
