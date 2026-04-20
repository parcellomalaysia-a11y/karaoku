'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export function getSupabase() {
  return createClientComponentClient()
}
