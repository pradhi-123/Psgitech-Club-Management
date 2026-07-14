import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Club, Event, EventRegistration, AttendanceScan, StudentCredits, Badge } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clgclub';

async function runOperations() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('Successfully connected to MongoDB!');

        // 1. Reset all student credits
        console.log('Resetting all student credits in StudentCredits collection...');
        const creditsResult = await StudentCredits.updateMany({}, {
            total_points: 0,
            events_attended: 0,
            badges_earned: 0,
            updated_at: new Date()
        });
        console.log(`Reset credits for ${creditsResult.modifiedCount} students.`);

        // 2. Delete all Badge records
        console.log('Deleting all badges...');
        const badgesDeleted = await Badge.deleteMany({});
        console.log(`Deleted ${badgesDeleted.deletedCount} badges.`);

        // 3. Delete all AttendanceScan records
        console.log('Deleting all attendance scans...');
        const scansDeleted = await AttendanceScan.deleteMany({});
        console.log(`Deleted ${scansDeleted.deletedCount} attendance scans.`);

        // 4. Delete all EventRegistration records
        console.log('Deleting all event registrations...');
        const regsDeleted = await EventRegistration.deleteMany({});
        console.log(`Deleted ${regsDeleted.deletedCount} registrations.`);

        // 5. Delete all Event records
        console.log('Deleting all existing events...');
        const eventsDeleted = await Event.deleteMany({});
        console.log(`Deleted ${eventsDeleted.deletedCount} events.`);

        // 6. Seed 1 event under each club for each coordinator
        console.log('Fetching clubs to seed events...');
        const clubs = await Club.find({});
        console.log(`Found ${clubs.length} clubs.`);

        const today = new Date();
        let eventIndex = 0;

        for (const club of clubs) {
            console.log(`\nProcessing club: "${club.name}"...`);
            const coordinatorsList = club.coordinators || [];
            if (coordinatorsList.length === 0) {
                console.warn(`⚠️ Warning: Club "${club.name}" has no coordinators configured. Skipping event seeding.`);
                continue;
            }

            let seededCount = 0;
            for (const coord of coordinatorsList) {
                if (!coord.roll_number && !coord.email) {
                    continue;
                }

                // Find the matching Mongoose user profile in the database
                const userQuery = [];
                if (coord.roll_number) userQuery.push({ roll_number: coord.roll_number.toUpperCase().trim() });
                if (coord.email) userQuery.push({ email: coord.email.toLowerCase().trim() });

                const coordUser = await User.findOne({ $or: userQuery });
                if (!coordUser) {
                    console.warn(`⚠️ Warning: Coordinator "${coord.name}" (${coord.roll_number || coord.email}) does not have a User account in the database. Cannot seed event under this coordinator.`);
                    continue;
                }

                console.log(`Seed event for "${club.name}" under coordinator "${coordUser.full_name}" (ID: ${coordUser._id})...`);

                // Calculate scattered non-clashing date. Offset by 2.5 hours per event.
                const offsetHours = eventIndex * 2.5;
                const specificEventDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 8 + Math.floor(offsetHours), (offsetHours % 1) * 60, 0);

                await Event.create({
                    club_id: club._id,
                    coordinator_id: coordUser._id,
                    name: `${club.name} Welcome & Orientation Meet`,
                    category: eventIndex % 2 === 0 ? 'Technical' : 'Cultural',
                    description: `Welcome to the introductory orientation and inaugural session of the ${club.name}. We will map our vision, talk about upcoming events/projects, and introduce our student leads and mentors. Attendance will grant credit points!`,
                    event_date: specificEventDate,
                    duration: 90, // in minutes
                    max_participants: 150,
                    credit_points: 2,
                    bonus_points: 0,
                    volunteer_points: 3,
                    volunteers: "",
                    created_at: new Date(),
                    updated_at: new Date()
                });

                seededCount++;
                eventIndex++;
                // Seed only 1 event per club (under the first valid coordinator we match)
                break;
            }

            if (seededCount === 0) {
                console.warn(`❌ Failed to seed an event for club "${club.name}" (no coordinators matched a valid User profile).`);
            } else {
                console.log(`✨ Successfully seeded 1 event for club "${club.name}".`);
            }
        }

        console.log('\nAll operations completed successfully! 🎉');
    } catch (err) {
        console.error('❌ Error executing database operations:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

runOperations();
