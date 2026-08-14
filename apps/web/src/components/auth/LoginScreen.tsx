import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'

type AuthMethod = 'magic-link' | 'password'
type PasswordMode = 'sign-in' | 'sign-up' | 'reset'

export function LoginScreen() {
	const { signInWithMagicLink, signInWithPassword, signUpWithPassword, resetPasswordForEmail } =
		useAuth()
	const [method, setMethod] = useState<AuthMethod>('magic-link')
	const [passwordMode, setPasswordMode] = useState<PasswordMode>('sign-in')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [sent, setSent] = useState(false)
	const [confirmPending, setConfirmPending] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onMagicLink = async (event: React.FormEvent) => {
		event.preventDefault()
		setSubmitting(true)
		setError(null)
		const { error: signInError } = await signInWithMagicLink(email.trim())
		setSubmitting(false)
		if (signInError) {
			setError(signInError.message)
			setSent(false)
			return
		}
		setSent(true)
	}

	const onPassword = async (event: React.FormEvent) => {
		event.preventDefault()
		setSubmitting(true)
		setError(null)
		setConfirmPending(false)
		const trimmed = email.trim()
		if (passwordMode === 'sign-in') {
			const { error: signInError } = await signInWithPassword(trimmed, password)
			setSubmitting(false)
			if (signInError) setError(signInError.message)
			return
		}
		const { error: signUpError, needsEmailConfirmation } = await signUpWithPassword(
			trimmed,
			password,
		)
		setSubmitting(false)
		if (signUpError) {
			setError(signUpError.message)
			return
		}
		if (needsEmailConfirmation) setConfirmPending(true)
	}

	const onReset = async (event: React.FormEvent) => {
		event.preventDefault()
		setSubmitting(true)
		setError(null)
		const { error: resetError } = await resetPasswordForEmail(email.trim())
		setSubmitting(false)
		if (resetError) {
			setError(resetError.message)
			setSent(false)
			return
		}
		setSent(true)
	}

	return (
		<div className="flex h-svh w-screen items-center justify-center bg-background px-4 text-foreground">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-1.5">
					<p className="font-heading text-2xl font-semibold tracking-tight">Ambit</p>
					<p className="text-sm text-muted-foreground">Sign in to open your map workspace.</p>
				</div>

				<Tabs
					value={method}
					onValueChange={(next) => {
						if (next === 'magic-link' || next === 'password') {
							setMethod(next)
							setError(null)
							setSent(false)
							setConfirmPending(false)
							setPasswordMode('sign-in')
						}
					}}
				>
					<TabsList className="w-full">
						<TabsTrigger value="magic-link" className="flex-1">
							Magic Link
						</TabsTrigger>
						<TabsTrigger value="password" className="flex-1">
							Password
						</TabsTrigger>
					</TabsList>

					<TabsContent value="magic-link" className="mt-4">
						{sent ? (
							<p className="text-sm text-muted-foreground" role="status">
								Check your email for a sign-in link
								{import.meta.env.DEV ? ' (local: Mailpit at http://127.0.0.1:54324)' : ''}.
							</p>
						) : (
							<form className="space-y-4" onSubmit={onMagicLink}>
								<div className="space-y-2">
									<Label htmlFor="login-email-magic">Email</Label>
									<Input
										id="login-email-magic"
										type="email"
										autoComplete="email"
										required
										placeholder="you@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={submitting}
									/>
								</div>
								{error ? (
									<p className="text-sm text-destructive" role="alert">
										{error}
									</p>
								) : null}
								<Button type="submit" className="w-full" disabled={submitting || !email.trim()}>
									{submitting ? 'Sending…' : 'Send Magic Link'}
								</Button>
							</form>
						)}
					</TabsContent>

					<TabsContent value="password" className="mt-4">
						{confirmPending ? (
							<p className="text-sm text-muted-foreground" role="status">
								Account created. Confirm your email
								{import.meta.env.DEV ? ' (local: Mailpit at http://127.0.0.1:54324)' : ''} before
								signing in.
							</p>
						) : passwordMode === 'reset' ? (
							sent ? (
								<div className="space-y-4">
									<p className="text-sm text-muted-foreground" role="status">
										If an account exists for that email, a reset link is on the way
										{import.meta.env.DEV ? ' (local: Mailpit at http://127.0.0.1:54324)' : ''}.
									</p>
									<Button
										type="button"
										variant="ghost"
										className="w-full"
										onClick={() => {
											setPasswordMode('sign-in')
											setSent(false)
											setError(null)
										}}
									>
										Back To Sign In
									</Button>
								</div>
							) : (
								<form className="space-y-4" onSubmit={onReset}>
									<div className="space-y-2">
										<Label htmlFor="login-email-reset">Email</Label>
										<Input
											id="login-email-reset"
											type="email"
											autoComplete="email"
											required
											placeholder="you@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											disabled={submitting}
										/>
									</div>
									{error ? (
										<p className="text-sm text-destructive" role="alert">
											{error}
										</p>
									) : null}
									<Button type="submit" className="w-full" disabled={submitting || !email.trim()}>
										{submitting ? 'Sending…' : 'Send Reset Link'}
									</Button>
									<Button
										type="button"
										variant="ghost"
										className="w-full"
										disabled={submitting}
										onClick={() => {
											setPasswordMode('sign-in')
											setError(null)
											setSent(false)
										}}
									>
										Back To Sign In
									</Button>
								</form>
							)
						) : (
							<form className="space-y-4" onSubmit={onPassword}>
								<div className="space-y-2">
									<Label htmlFor="login-email-password">Email</Label>
									<Input
										id="login-email-password"
										type="email"
										autoComplete="email"
										required
										placeholder="you@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={submitting}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="login-password">Password</Label>
									<Input
										id="login-password"
										type="password"
										autoComplete={passwordMode === 'sign-in' ? 'current-password' : 'new-password'}
										required
										minLength={6}
										placeholder="••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										disabled={submitting}
									/>
								</div>
								{error ? (
									<p className="text-sm text-destructive" role="alert">
										{error}
									</p>
								) : null}
								<Button
									type="submit"
									className="w-full"
									disabled={submitting || !email.trim() || password.length < 6}
								>
									{submitting
										? passwordMode === 'sign-in'
											? 'Signing In…'
											: 'Creating Account…'
										: passwordMode === 'sign-in'
											? 'Sign In'
											: 'Create Account'}
								</Button>
								{passwordMode === 'sign-in' ? (
									<Button
										type="button"
										variant="ghost"
										className="w-full"
										disabled={submitting}
										onClick={() => {
											setPasswordMode('reset')
											setError(null)
											setSent(false)
										}}
									>
										Forgot Password?
									</Button>
								) : null}
								<Button
									type="button"
									variant="ghost"
									className="w-full"
									disabled={submitting}
									onClick={() => {
										setPasswordMode((mode) => (mode === 'sign-in' ? 'sign-up' : 'sign-in'))
										setError(null)
									}}
								>
									{passwordMode === 'sign-in'
										? 'Need An Account? Create One'
										: 'Already Have An Account? Sign In'}
								</Button>
							</form>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
