import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { useDocumentStore } from '@/store/documentStore'

export function ToastStack() {
	const toasts = useDocumentStore((s) => s.toasts)
	const dismissToast = useDocumentStore((s) => s.dismissToast)

	useEffect(() => {
		if (toasts.length === 0) return
		const latest = toasts[toasts.length - 1]
		if (!latest) return
		const timer = window.setTimeout(() => dismissToast(latest.id), 3200)
		return () => window.clearTimeout(timer)
	}, [toasts, dismissToast])

	if (toasts.length === 0) return null

	return (
		<div className="pointer-events-none absolute right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={cn(
						'pointer-events-auto rounded-lg border border-neutral-700 bg-neutral-900/95 px-3 py-2 text-sm text-neutral-100 shadow-lg backdrop-blur',
					)}
				>
					{toast.message}
				</div>
			))}
		</div>
	)
}
