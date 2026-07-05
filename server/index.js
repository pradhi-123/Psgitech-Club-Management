import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models.js';
import authRouter from './routes/auth.js';
import clubsRouter from './routes/clubs.js';
import eventsRouter from './routes/events.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clgclub';

// Middlewares
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/events', eventsRouter);

// Root route for simple checking
app.get('/', (req, res) => {
  res.send('PSG iTech Club Zone API is running...');
});

// Admin User Seeder (Run on Database connection success)
const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@psgitech.edu';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('Seeding default administrator user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('psgitech@123', salt);
      
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        full_name: 'System Administrator',
        role: 'admin'
      });
      console.log('Default Admin Account Created successfully!');
      console.log('Email: admin@psgitech.edu');
      console.log('Password: psgitech@123');
    } else {
      console.log('Administrator account already exists. Skipping seeding.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Database Connection & Start Server with Automatic Fallback
const startServer = async () => {
  try {
    console.log('Attempting connection to primary MongoDB Atlas database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB Atlas!');
    await seedAdminUser();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to primary MongoDB Atlas database:', err.message);
    
    const fallbackUri = 'mongodb://localhost:27017/clgclub';
    if (MONGODB_URI !== fallbackUri) {
      console.log(`Falling back to local MongoDB database (${fallbackUri})...`);
      try {
        await mongoose.connect(fallbackUri);
        console.log('Successfully connected to local MongoDB fallback!');
        await seedAdminUser();
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      } catch (fallbackErr) {
        console.error('Failed to connect to local database fallback too:', fallbackErr.message);
      }
    }
  }
};

startServer();
