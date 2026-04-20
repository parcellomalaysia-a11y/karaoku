import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function getServerSupabase() {
  return createServerComponentClient({ cookies })
}

export function getRouteHandlerSupabase() {
  return createRouteHandlerClient({ cookies })
}

// Admin client — bypasses RLS. Server-side only. NEVER import in client components.
export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
