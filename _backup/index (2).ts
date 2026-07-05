import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationId } = await req.json();

    if (!registrationId) {
      throw new Error('Registration ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch registration details with student and event info
    const { data: registration, error: fetchError } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events (
          name,
          event_date,
          duration,
          credit_points,
          clubs (name)
        ),
        profiles:student_id (
          full_name,
          roll_number,
          department,
          year,
          section
        )
      `)
      .eq('id', registrationId)
      .single();

    if (fetchError || !registration) {
      throw new Error('Registration not found');
    }

    if (!registration.attendance_confirmed) {
      throw new Error('Attendance not confirmed for this event');
    }

    // Prepare certificate data
    const certificateData = {
      studentName: registration.profiles?.full_name || 'Student',
      rollNumber: registration.profiles?.roll_number || '',
      department: registration.profiles?.department || '',
      year: registration.profiles?.year || '',
      section: registration.profiles?.section || '',
      eventName: registration.events?.name || 'Event',
      clubName: registration.events?.clubs?.name || 'Club',
      eventDate: new Date(registration.events?.event_date || '').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      creditPoints: registration.points_awarded || 0,
      certificateId: `CERT-${registrationId.substring(0, 8).toUpperCase()}`,
      issuedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Update certificate_generated flag
    await supabase
      .from('event_registrations')
      .update({ certificate_generated: true })
      .eq('id', registrationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate: certificateData,
        message: 'Certificate generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating certificate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
