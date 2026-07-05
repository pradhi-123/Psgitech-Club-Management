-- Delete all foreign key dependent data first
DELETE FROM attendance_scans;
DELETE FROM student_credits;
DELETE FROM event_registrations;
DELETE FROM events;
DELETE FROM club_coordinators;

-- Delete profiles except admin
DELETE FROM profiles WHERE role != 'admin';

-- Note: Clubs are preserved as requested
