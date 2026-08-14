import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
	throw new Error(
		'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy apps/web/.env.example to .env.',
	)
}

/** Browser singleton — publishable key only; never service_role. */
export const supabase = createClient<Database>(url, publishableKey, {
	auth: {
		flowType: 'pkce',
		detectSessionInUrl: true,
		persistSession: true,
		autoRefreshToken: true,
	},
})
