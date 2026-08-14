import { LoginScreen } from '@/components/auth/LoginScreen'
import { ResetPasswordScreen } from '@/components/auth/ResetPasswordScreen'
import { useAuth } from '@/hooks/useAuth'

type AuthGateProps = {
	children: React.ReactNode
}

/** No verified claims → login; recovery session → set password; loading → spinner. */
export function AuthGate({ children }: AuthGateProps) {
	const { claims, loading, passwordRecovery } = useAuth()

	if (loading) {
		return (
			<div className="flex h-svh w-screen items-center justify-center bg-background text-sm text-muted-foreground">
				Loading…
			</div>
		)
	}

	if (passwordRecovery) {
		return <ResetPasswordScreen />
	}

	if (!claims) {
		return <LoginScreen />
	}

	return children
}
