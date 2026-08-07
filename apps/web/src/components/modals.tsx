import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type PromptModalProps = {
	open: boolean
	title: string
	label: string
	initialValue?: string
	confirmLabel?: string
	onConfirm: (value: string) => void
	onCancel: () => void
}

export function PromptModal({
	open,
	title,
	label,
	initialValue = '',
	confirmLabel = 'Create',
	onConfirm,
	onCancel,
}: PromptModalProps) {
	const [value, setValue] = useState(initialValue)
	const inputRef = useRef<HTMLInputElement>(null)
	const titleId = useId()

	useEffect(() => {
		if (open) {
			setValue(initialValue)
			queueMicrotask(() => inputRef.current?.focus())
		}
	}, [open, initialValue])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
			<form
				aria-labelledby={titleId}
				className="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
				onSubmit={(e) => {
					e.preventDefault()
					if (!value.trim()) return
					onConfirm(value.trim())
				}}
			>
				<h2 id={titleId} className="mb-3 text-sm font-semibold text-neutral-50">
					{title}
				</h2>
				<label className="mb-1 block text-xs text-neutral-400" htmlFor="prompt-input">
					{label}
				</label>
				<input
					id="prompt-input"
					ref={inputRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					className="mb-4 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500"
				/>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!value.trim()}
						className={cn(
							'rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900',
							!value.trim() && 'opacity-40',
						)}
					>
						{confirmLabel}
					</button>
				</div>
			</form>
		</div>
	)
}

type ConfirmModalProps = {
	open: boolean
	title: string
	message: string
	confirmLabel?: string
	onConfirm: () => void
	onCancel: () => void
}

export function ConfirmModal({
	open,
	title,
	message,
	confirmLabel = 'Delete',
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	const titleId = useId()
	if (!open) return null

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
			<div
				role="dialog"
				aria-labelledby={titleId}
				className="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
			>
				<h2 id={titleId} className="mb-2 text-sm font-semibold text-neutral-50">
					{title}
				</h2>
				<p className="mb-4 text-sm text-neutral-400">{message}</p>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
