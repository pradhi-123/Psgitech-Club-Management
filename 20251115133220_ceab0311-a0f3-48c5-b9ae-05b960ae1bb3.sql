-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'student');
CREATE TYPE event_category AS ENUM ('Quiz', 'Guest Lecture', 'Competition', 'Workshop', 'Cultural', 'Sports', 'Technical', 'Other');
CREATE TYPE scan_type AS ENUM ('entry', 'exit');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  roll_number TEXT UNIQUE,
  department TEXT,
  section TEXT,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club coordinators table
CREATE TABLE public.club_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  signature_url TEXT,
  signature_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, club_id)
);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category event_category NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  max_participants INTEGER,
  credit_points INTEGER DEFAULT 2,
  bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  entry_scanned_at TIMESTAMP WITH TIME ZONE,
  exit_scanned_at TIMESTAMP WITH TIME ZONE,
  attendance_confirmed BOOLEAN DEFAULT FALSE,
  points_awarded INTEGER DEFAULT 0,
  certificate_generated BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- Attendance scans table
CREATE TABLE public.attendance_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  scan_type scan_type NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Student credits table
CREATE TABLE public.student_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_level INTEGER NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for clubs (public read, admin write)
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage clubs" ON public.clubs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for club_coordinators
CREATE POLICY "Anyone can view coordinators" ON public.club_coordinators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage coordinators" ON public.club_coordinators FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for events
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators can manage their club events" ON public.events FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.club_coordinators cc
    WHERE cc.user_id = auth.uid() AND cc.club_id = events.club_id
  )
);
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for event_registrations
CREATE POLICY "Students can view their registrations" ON public.event_registrations FOR SELECT TO authenticated USING (
  student_id = auth.uid()
);
CREATE POLICY "Students can register for events" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (
  student_id = auth.uid()
);
CREATE POLICY "Coordinators can view registrations for their events" ON public.event_registrations FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.club_coordinators cc ON cc.club_id = e.club_id
    WHERE e.id = event_registrations.event_id AND cc.user_id = auth.uid()
  )
);
CREATE POLICY "Coordinators can update registrations for their events" ON public.event_registrations FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.club_coordinators cc ON cc.club_id = e.club_id
    WHERE e.id = event_registrations.event_id AND cc.user_id = auth.uid()
  )
);

-- RLS Policies for attendance_scans
CREATE POLICY "Anyone can view scans" ON public.attendance_scans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators can create scans" ON public.attendance_scans FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coordinator')
);

-- RLS Policies for student_credits
CREATE POLICY "Students can view their credits" ON public.student_credits FOR SELECT TO authenticated USING (
  student_id = auth.uid()
);
CREATE POLICY "Anyone can view all credits" ON public.student_credits FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can update credits" ON public.student_credits FOR ALL TO authenticated USING (true);

-- RLS Policies for badges
CREATE POLICY "Students can view their badges" ON public.badges FOR SELECT TO authenticated USING (
  student_id = auth.uid()
);
CREATE POLICY "Anyone can view all badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can create badges" ON public.badges FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for announcements
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators and admins can create announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('coordinator', 'admin'))
);

-- Function to auto-create student_credits on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_credits (student_id, total_points, events_attended, badges_earned)
    VALUES (NEW.id, 0, 0, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();

-- Function to update credits and check for badges
CREATE OR REPLACE FUNCTION public.update_student_credits()
RETURNS TRIGGER AS $$
DECLARE
  current_points INTEGER;
  new_badge_level INTEGER;
BEGIN
  IF NEW.attendance_confirmed = TRUE AND OLD.attendance_confirmed = FALSE THEN
    -- Update student credits
    UPDATE public.student_credits
    SET 
      total_points = total_points + NEW.points_awarded,
      events_attended = events_attended + 1,
      updated_at = NOW()
    WHERE student_id = NEW.student_id
    RETURNING total_points INTO current_points;
    
    -- Check if new badge should be awarded (every 5 points)
    new_badge_level := FLOOR(current_points / 5);
    
    -- Create badge if doesn't exist for this level
    INSERT INTO public.badges (student_id, badge_level, badge_name, earned_at)
    SELECT NEW.student_id, new_badge_level, 'Level ' || new_badge_level || ' Achiever', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.badges WHERE student_id = NEW.student_id AND badge_level = new_badge_level
    );
    
    -- Update badges count
    UPDATE public.student_credits
    SET badges_earned = (SELECT COUNT(*) FROM public.badges WHERE student_id = NEW.student_id)
    WHERE student_id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_attendance_confirmed
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_student_credits();

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_roll_number ON public.profiles(roll_number);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_event_registrations_student ON public.event_registrations(student_id);
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_student_credits_student ON public.student_credits(student_id);