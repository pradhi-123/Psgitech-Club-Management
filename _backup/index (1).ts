import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Check if user is admin
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Only admins can create users')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, full_name, role, roll_number, department, section, year, club_id } = await req.json()

    console.log('Creating user:', { email, role, full_name })

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, and role are required')
    }

    // Find existing user by email (if any)
    let userId: string | null = null
    try {
      const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const found = usersPage?.users?.find((u: any) => (u.email || '').toLowerCase() === (email || '').toLowerCase())
      if (found) userId = found.id
    } catch (_) {
      // ignore list errors and proceed to create
    }

    // Create auth user using admin privileges if not found
    if (!userId) {
      console.log('Creating new auth user for:', email)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createErr) {
        console.error('Auth user creation error:', createErr)
        throw createErr
      }
      if (!created.user) throw new Error('User creation failed')
      userId = created.user.id
      console.log('Auth user created with ID:', userId)
    } else {
      console.log('User already exists with ID:', userId)
    }

    // Ensure profile exists
    const profileData: Record<string, any> = {
      id: userId,
      role,
      full_name,
      email,
    }
    if (role === 'student') {
      profileData.roll_number = roll_number
      profileData.department = department
      profileData.section = section
      profileData.year = year
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingProfile) {
      console.log('Inserting profile:', profileData)
      const { error: insertProfileErr } = await supabaseAdmin.from('profiles').insert([profileData])
      if (insertProfileErr) {
        console.error('Profile insertion error:', insertProfileErr)
        throw insertProfileErr
      }
      console.log('Profile created successfully')
    } else {
      console.log('Profile already exists, updating if needed')
      const { error: updateProfileErr } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
      if (updateProfileErr) {
        console.error('Profile update error:', updateProfileErr)
        throw updateProfileErr
      }
    }

    // If coordinator, ensure club link exists
    if (role === 'coordinator' && club_id) {
      const { data: existingLink } = await supabaseAdmin
        .from('club_coordinators')
        .select('id')
        .eq('user_id', userId)
        .eq('club_id', club_id)
        .maybeSingle()

      if (!existingLink) {
        const { error: linkErr } = await supabaseAdmin
          .from('club_coordinators')
          .insert([{ user_id: userId, club_id }])
        if (linkErr) throw linkErr
      }
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in create-user function:', errorMessage, error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
