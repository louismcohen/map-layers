import type { JwtPayload } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const RECOVERY_KEY = 'ambit:password-recovery'

async function readClaims(): Promise<JwtPayload | null> {
	const { data, error } = await supabase.auth.getClaims()
	if (error || !data?.claims) return null
	return data.claims
}

function readStoredRecovery(): boolean {
	try {
		return sessionStorage.getItem(RECOVERY_KEY) === '1'
	} catch {
		return false
	}
}

function writeStoredRecovery(value: boolean) {
	try {
		if (value) sessionStorage.setItem(RECOVERY_KEY, '1')
		else sessionStorage.removeItem(RECOVERY_KEY)
	} catch {
		// sessionStorage may be unavailable
	}
}

/**
 * Session lives in supabase-js storage — no authStore.
 * Gate identity with getClaims() (JWKS); do not authorize from getSession().user.
 */
export function useAuth() {
	const [claims, setClaims] = useState<JwtPayload | null>(null)
	const [loading, setLoading] = useState(true)
	const [passwordRecovery, setPasswordRecovery] = useState(readStoredRecovery)

	const setRecovery = useCallback((value: boolean) => {
		writeStoredRecovery(value)
		setPasswordRecovery(value)
	}, [])

	useEffect(() => {
		let cancelled = false

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event) => {
			if (event === 'PASSWORD_RECOVERY') setRecovery(true)
			if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') setRecovery(false)
			void readClaims().then((next) => {
				if (!cancelled) {
					setClaims(next)
					setLoading(false)
				}
			})
		})

		return () => {
			cancelled = true
			subscription.unsubscribe()
		}
	}, [setRecovery])

	const signInWithMagicLink = useCallback(async (email: string) => {
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: window.location.origin,
			},
		})
		return { error }
	}, [])

	const signInWithPassword = useCallback(async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({ email, password })
		if (!error) setClaims(await readClaims())
		return { error }
	}, [])

	const signUpWithPassword = useCallback(async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signUp({ email, password })
		if (error) return { error, needsEmailConfirmation: false }
		if (data.session) {
			setClaims(await readClaims())
			return { error: null, needsEmailConfirmation: false }
		}
		// Hosted projects often require email confirmation before a session exists.
		return { error: null, needsEmailConfirmation: true }
	}, [])

	const resetPasswordForEmail = useCallback(async (email: string) => {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: window.location.origin,
		})
		return { error }
	}, [])

	const updatePassword = useCallback(
		async (password: string) => {
			const { error } = await supabase.auth.updateUser({ password })
			if (!error) setRecovery(false)
			return { error }
		},
		[setRecovery],
	)

	const signOut = useCallback(async () => {
		const { error } = await supabase.auth.signOut()
		if (!error) {
			setClaims(null)
			setRecovery(false)
		}
		return { error }
	}, [setRecovery])

	return {
		claims,
		loading,
		passwordRecovery,
		signInWithMagicLink,
		signInWithPassword,
		signUpWithPassword,
		resetPasswordForEmail,
		updatePassword,
		signOut,
	}
}
