import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

/** Shown after the recovery email link establishes a PASSWORD_RECOVERY session. */
export function ResetPasswordScreen() {
	const { updatePassword, signOut } = useAuth()
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const mismatch = confirm.length > 0 && password !== confirm

	const onSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (password !== confirm) {
			setError('Passwords do not match.')
			return
		}
		setSubmitting(true)
		setError(null)
		const { error: updateError } = await updatePassword(password)
		setSubmitting(false)
		if (updateError) setError(updateError.message)
	}

	return (
		<div className="flex h-svh w-screen items-center justify-center bg-background px-4 text-foreground">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-1.5">
					<p className="font-heading text-2xl font-semibold tracking-tight">Ambit</p>
					<p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
				</div>

				<form className="space-y-4" onSubmit={onSubmit}>
					<div className="space-y-2">
						<Label htmlFor="reset-password">New password</Label>
						<Input
							id="reset-password"
							type="password"
							autoComplete="new-password"
							required
							minLength={6}
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={submitting}
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="reset-password-confirm">Confirm password</Label>
						<Input
							id="reset-password-confirm"
							type="password"
							autoComplete="new-password"
							required
							minLength={6}
							placeholder="••••••••"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							disabled={submitting}
						/>
					</div>
					{error || mismatch ? (
						<p className="text-sm text-destructive" role="alert">
							{error ?? 'Passwords do not match.'}
						</p>
					) : null}
					<Button
						type="submit"
						className="w-full"
						disabled={submitting || password.length < 6 || password !== confirm}
					>
						{submitting ? 'Saving…' : 'Save Password'}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						disabled={submitting}
						onClick={() => void signOut()}
					>
						Cancel
					</Button>
				</form>
			</div>
		</div>
	)
}
